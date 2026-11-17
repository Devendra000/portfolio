import { unauthorized } from '@/lib/auth/dal'
import { confirmBill } from '@/lib/tracker/bills'
import { createApplication, listApplications } from '@/lib/tracker/db'
import { parseApplication } from '@/lib/tracker/schema'

export const dynamic = 'force-dynamic'

// GET  /api/applications       → { applications: Application[] }
// POST /api/applications {...} → { application }  (201)
export async function GET() {
  const denied = await unauthorized()
  if (denied) return denied
  return Response.json({ applications: await listApplications() }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: Request) {
  const denied = await unauthorized()
  if (denied) return denied

  const body = await req.json().catch(() => null)
  const parsed = parseApplication(body)
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 })
  if (parsed.data.billKey && !(await confirmBill(parsed.data.billKey))) {
    return Response.json({ error: 'Bill upload not found — upload it again.' }, { status: 400 })
  }

  return Response.json({ application: await createApplication(parsed.data) }, { status: 201 })
}
