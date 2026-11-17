import { unauthorized } from '@/lib/auth/dal'
import { confirmBill, deleteBill } from '@/lib/tracker/bills'
import { deleteApplication, getApplication, updateApplication } from '@/lib/tracker/db'
import { parseApplication } from '@/lib/tracker/schema'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }
const UUID_RE = /^[0-9a-f-]{36}$/i
const notFound = () => Response.json({ error: 'Not found' }, { status: 404 })

// GET    /api/applications/:id
// PATCH  /api/applications/:id {...partial}  (send "" or null to clear a field)
// DELETE /api/applications/:id
export async function GET(_req: Request, { params }: Ctx) {
  const denied = await unauthorized()
  if (denied) return denied
  const { id } = await params
  if (!UUID_RE.test(id)) return notFound()
  const app = await getApplication(id)
  return app ? Response.json({ application: app }) : notFound()
}

export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await unauthorized()
  if (denied) return denied
  const { id } = await params
  if (!UUID_RE.test(id)) return notFound()

  const parsed = parseApplication(await req.json().catch(() => null), true)
  if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400 })

  // Replacing or removing the bill: check the new one exists, delete the old one after.
  let oldBill: string | undefined
  if ('billKey' in parsed.data) {
    const newBill = parsed.data.billKey as string | null
    if (newBill && !(await confirmBill(newBill))) {
      return Response.json({ error: 'Bill upload not found — upload it again.' }, { status: 400 })
    }
    oldBill = (await getApplication(id))?.billKey
    if (oldBill === newBill) oldBill = undefined
  }

  const app = await updateApplication(id, parsed.data)
  if (!app) return notFound()
  if (oldBill) await deleteBill(oldBill)
  return Response.json({ application: app })
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const denied = await unauthorized()
  if (denied) return denied
  const { id } = await params
  if (!UUID_RE.test(id)) return notFound()
  const bill = (await getApplication(id))?.billKey
  if (!(await deleteApplication(id))) return notFound()
  if (bill) await deleteBill(bill)
  return Response.json({ ok: true })
}
