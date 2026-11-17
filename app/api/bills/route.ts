import { randomUUID } from 'node:crypto'
import { unauthorized } from '@/lib/auth/dal'
import { ALLOWED_BILL_TYPES, createBillUploadUrl, MAX_BILL_BYTES } from '@/lib/tracker/bills'

export const dynamic = 'force-dynamic'

// POST { contentType, size } → { key, uploadUrl }
// The browser PUTs the file straight to the Cloudflare Worker with uploadUrl
// (valid 5 min), then saves `key` as the application's billKey.
export async function POST(req: Request) {
  const denied = await unauthorized()
  if (denied) return denied

  const body = await req.json().catch(() => null)
  const ext = ALLOWED_BILL_TYPES[body?.contentType]
  if (!ext) return Response.json({ error: 'Bill must be a JPG, PNG, WebP or PDF.' }, { status: 400 })
  if (!Number.isInteger(body?.size) || body.size < 1 || body.size > MAX_BILL_BYTES) {
    return Response.json({ error: 'Bill must be under 10 MB.' }, { status: 400 })
  }

  const key = `bills/${randomUUID()}.${ext}`
  try {
    return Response.json({ key, uploadUrl: createBillUploadUrl(key, body.contentType) })
  } catch (err) {
    console.error('[bills]', err)
    return Response.json({ error: 'Bill storage is not configured.' }, { status: 503 })
  }
}
