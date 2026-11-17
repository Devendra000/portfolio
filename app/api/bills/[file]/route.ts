import { unauthorized } from '@/lib/auth/dal'
import { BILL_KEY_RE, fetchBill } from '@/lib/tracker/bills'

export const dynamic = 'force-dynamic'

// GET /api/bills/<uuid>.<ext> → streams the private bill from the Worker (owner only).
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const denied = await unauthorized()
  if (denied) return denied

  const key = `bills/${(await params).file}`
  if (!BILL_KEY_RE.test(key)) return new Response(null, { status: 404 })

  try {
    const res = await fetchBill(key)
    if (!res.ok || !res.body) return new Response(null, { status: 404 })
    return new Response(res.body, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') ?? 'application/octet-stream',
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('[bills] fetch failed', err)
    return new Response(null, { status: 502 })
  }
}
