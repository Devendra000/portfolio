import 'server-only'
import { createHmac } from 'node:crypto'

// Client for the tracker-bills Cloudflare Worker (workers/tracker-bills),
// which stores bills in R2 through a native binding — no S3 API.
// Env: BILLS_WORKER_URL (e.g. https://tracker-bills.<you>.workers.dev, or
//      http://localhost:8787 with `pnpm bills:dev`), BILLS_WORKER_SECRET
//      (same value as the Worker's SHARED_SECRET, 32+ chars).

export const ALLOWED_BILL_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}
export const MAX_BILL_BYTES = 10 * 1024 * 1024
export { BILL_KEY_RE } from './schema'

function config() {
  const url = process.env.BILLS_WORKER_URL?.replace(/\/$/, '')
  const secret = process.env.BILLS_WORKER_SECRET
  if (!url || !secret) throw new Error('BILLS_WORKER_URL / BILLS_WORKER_SECRET are not set')
  return { url, secret }
}

const auth = (secret: string) => ({ Authorization: `Bearer ${secret}` })

/** A 5-minute URL the browser can PUT the file to (must send this exact Content-Type). */
export function createBillUploadUrl(key: string, contentType: string) {
  const { url, secret } = config()
  const exp = Math.floor(Date.now() / 1000) + 300
  const sig = createHmac('sha256', secret).update(`PUT\n${key}\n${contentType}\n${exp}`).digest('base64url')
  return `${url}/${key}?exp=${exp}&sig=${sig}`
}

/** True if the bill was really uploaded (and within size). */
export async function confirmBill(key: string): Promise<boolean> {
  const { url, secret } = config()
  const res = await fetch(`${url}/${key}`, { method: 'HEAD', headers: auth(secret), cache: 'no-store' })
  return res.ok && Number(res.headers.get('Content-Length')) <= MAX_BILL_BYTES
}

export async function fetchBill(key: string): Promise<Response> {
  const { url, secret } = config()
  return fetch(`${url}/${key}`, { headers: auth(secret), cache: 'no-store' })
}

export async function deleteBill(key: string): Promise<void> {
  try {
    const { url, secret } = config()
    await fetch(`${url}/${key}`, { method: 'DELETE', headers: auth(secret) })
  } catch (err) {
    console.error('[bills] delete failed', key, err)
  }
}
