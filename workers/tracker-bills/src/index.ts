// Cloudflare Worker that owns the tracker's bill/receipt files in R2.
// Native R2 binding — no S3 API. The Vercel app talks to it two ways:
//
//  1. Browser upload:  PUT /bills/<uuid>.<ext>?exp=<unix>&sig=<hmac>
//     The Vercel app signs (key, content-type, expiry) with SHARED_SECRET and
//     hands the URL to the logged-in browser, which PUTs the file here
//     directly. Signed URLs live 5 minutes and can't overwrite an existing file.
//
//  2. Server-to-server: GET / HEAD / DELETE /bills/<key>
//     with `Authorization: Bearer <SHARED_SECRET>`. The bucket is never public;
//     bills are only viewable through the tracker's logged-in /api/bills route.

interface R2ObjectLike {
  size: number
  httpMetadata?: { contentType?: string }
}
interface R2ObjectBodyLike extends R2ObjectLike {
  body: ReadableStream
}
interface R2BucketLike {
  head(key: string): Promise<R2ObjectLike | null>
  get(key: string): Promise<R2ObjectBodyLike | null>
  put(key: string, body: ReadableStream | null, opts?: { httpMetadata?: { contentType?: string } }): Promise<unknown>
  delete(key: string): Promise<void>
}

interface Env {
  BILLS: R2BucketLike
  SHARED_SECRET: string
  ALLOWED_ORIGINS: string // comma-separated, e.g. "https://devendrahamal.com,http://localhost:3000"
}

const KEY_RE = /^bills\/[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/
const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf' }
const MAX_BYTES = 10 * 1024 * 1024

const enc = new TextEncoder()

async function hmacKey(secret: string) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
}

function fromBase64Url(s: string): Uint8Array | null {
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
    return Uint8Array.from(bin, (c) => c.charCodeAt(0))
  } catch {
    return null
  }
}

/** Constant-time check of the bearer token (via HMAC so length leaks nothing). */
async function bearerOk(req: Request, secret: string) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  const k = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const [a, b] = await Promise.all([crypto.subtle.sign('HMAC', k, enc.encode(token)), crypto.subtle.sign('HMAC', k, enc.encode(secret))])
  const x = new Uint8Array(a), y = new Uint8Array(b)
  let diff = 0
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i]
  return diff === 0
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (!env.SHARED_SECRET || env.SHARED_SECRET.length < 32) return new Response('Worker misconfigured', { status: 500 })

    const url = new URL(req.url)
    const origin = req.headers.get('Origin') ?? ''
    const allowed = (env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean)
    const cors: Record<string, string> = allowed.includes(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}
    const reply = (status: number, body?: string) => new Response(body ?? null, { status, headers: cors })

    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: { ...cors, 'Access-Control-Allow-Methods': 'PUT', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '3000' },
      })
    }

    const key = decodeURIComponent(url.pathname.slice(1))
    if (!KEY_RE.test(key)) return reply(404)

    // ---- 1. Signed browser upload ----
    if (req.method === 'PUT') {
      const exp = url.searchParams.get('exp') ?? ''
      const sig = fromBase64Url(url.searchParams.get('sig') ?? '')
      const contentType = req.headers.get('Content-Type') ?? ''
      const length = Number(req.headers.get('Content-Length'))

      if (!sig || !/^\d+$/.test(exp) || Number(exp) < Date.now() / 1000) return reply(403, 'Upload link expired')
      const valid = await crypto.subtle.verify('HMAC', await hmacKey(env.SHARED_SECRET), sig, enc.encode(`PUT\n${key}\n${contentType}\n${exp}`))
      if (!valid) return reply(403, 'Bad signature')
      if (contentType !== TYPES[key.split('.').pop()!]) return reply(400, 'Wrong content type')
      if (!length || length > MAX_BYTES) return reply(413, 'File must be 1 byte – 10 MB')
      if (await env.BILLS.head(key)) return reply(409, 'Already uploaded')

      await env.BILLS.put(key, req.body, { httpMetadata: { contentType } })
      return reply(201)
    }

    // ---- 2. Server-to-server (Vercel app) ----
    if (!(await bearerOk(req, env.SHARED_SECRET))) return reply(401)

    if (req.method === 'GET' || req.method === 'HEAD') {
      const obj = req.method === 'GET' ? await env.BILLS.get(key) : await env.BILLS.head(key)
      if (!obj) return reply(404)
      return new Response(req.method === 'GET' ? (obj as R2ObjectBodyLike).body : null, {
        headers: { 'Content-Type': obj.httpMetadata?.contentType ?? 'application/octet-stream', 'Content-Length': String(obj.size) },
      })
    }
    if (req.method === 'DELETE') {
      await env.BILLS.delete(key)
      return reply(204)
    }
    return reply(405)
  },
}
