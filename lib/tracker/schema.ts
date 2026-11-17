// Shared types + validation for job applications. Safe to import on the client.

export const ORGANIZATIONS = [
  'RBB', // Rastriya Banijya Bank
  'NRB', // Nepal Rastra Bank
  'PSC', // Lok Sewa Aayog
  'NBL', // Nepal Bank Limited
  'ADBL', // Agricultural Development Bank
  'NTC', // Nepal Telecom
  'NEA', // Nepal Electricity Authority
  'Other',
] as const

export const STATUSES = [
  'planned', // found the vacancy, not applied yet
  'applied',
  'admit_card', // admit card / roll number issued
  'written_exam',
  'shortlisted', // passed written, waiting for interview
  'interview',
  'selected',
  'rejected',
  'withdrawn',
] as const

export const STATUS_LABELS: Record<Status, string> = {
  planned: 'Planned',
  applied: 'Applied',
  admit_card: 'Admit card',
  written_exam: 'Written exam',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  selected: 'Selected',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
}

export const PAYMENT_STATUSES = ['unpaid', 'paid'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

// Stored bill object key in R2 (see lib/tracker/r2.ts).
export const BILL_KEY_RE = /^bills\/[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/

export type Organization = (typeof ORGANIZATIONS)[number]
export type Status = (typeof STATUSES)[number]

export type Application = {
  id: string
  organization: Organization
  organizationOther?: string // name when organization === 'Other'
  position: string // e.g. "Assistant (Fourth Level)"
  level?: string // e.g. "Officer, 6th level"
  advertisementNo?: string // vigyapan number, e.g. "12/082-83"
  rollNumber?: string
  status: Status
  appliedDate?: string // YYYY-MM-DD
  deadline?: string // YYYY-MM-DD
  examDate?: string // YYYY-MM-DD
  interviewDate?: string // YYYY-MM-DD
  fee?: number // NPR — the exam fee asked for
  paymentStatus?: PaymentStatus // missing on old records = unpaid
  paidAmount?: number // NPR actually paid (defaults to fee when marked paid)
  paidDate?: string // YYYY-MM-DD
  paymentMethod?: string // Khalti, eSewa, ConnectIPS, bank voucher…
  voucherNumber?: string // transaction id / voucher no. from the bill
  billKey?: string // R2 object key of the uploaded bill/receipt
  link?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type ApplicationInput = Omit<Application, 'id' | 'createdAt' | 'updatedAt'>

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const DATE_FIELDS = ['appliedDate', 'deadline', 'examDate', 'interviewDate', 'paidDate'] as const
const TEXT_FIELDS = { organizationOther: 100, level: 100, advertisementNo: 50, rollNumber: 50, paymentMethod: 50, voucherNumber: 100, link: 500, notes: 5000 } as const

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

/**
 * Validate a create (partial = false) or update (partial = true) payload.
 * Unknown keys are dropped. On update, an empty string / null clears a field
 * (returned as `null` so the data layer can REMOVE it).
 */
export function parseApplication(body: unknown, partial: true): Result<Record<string, unknown>>
export function parseApplication(body: unknown, partial?: false): Result<ApplicationInput>
export function parseApplication(body: unknown, partial = false): Result<Record<string, unknown>> {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Body must be a JSON object.' }
  const b = body as Record<string, unknown>
  const out: Record<string, unknown> = {}
  const has = (k: string) => k in b && b[k] !== undefined
  const blank = (v: unknown) => v === null || (typeof v === 'string' && v.trim() === '')

  // Required on create
  if (!partial || has('organization')) {
    if (!ORGANIZATIONS.includes(b.organization as Organization)) return { ok: false, error: `organization must be one of ${ORGANIZATIONS.join(', ')}.` }
    out.organization = b.organization
  }
  if (!partial || has('position')) {
    if (typeof b.position !== 'string' || !b.position.trim()) return { ok: false, error: 'position is required.' }
    out.position = b.position.trim().slice(0, 200)
  }
  if (!partial || has('status')) {
    const status = b.status ?? (partial ? undefined : 'applied')
    if (!STATUSES.includes(status as Status)) return { ok: false, error: `status must be one of ${STATUSES.join(', ')}.` }
    out.status = status
  }

  if (!partial || has('paymentStatus')) {
    const ps = b.paymentStatus ?? (partial ? undefined : 'unpaid')
    if (!PAYMENT_STATUSES.includes(ps as PaymentStatus)) return { ok: false, error: `paymentStatus must be one of ${PAYMENT_STATUSES.join(', ')}.` }
    out.paymentStatus = ps
  }

  // Optional
  for (const [k, max] of Object.entries(TEXT_FIELDS)) {
    if (!has(k)) continue
    if (blank(b[k])) { if (partial) out[k] = null; continue }
    if (typeof b[k] !== 'string') return { ok: false, error: `${k} must be a string.` }
    out[k] = (b[k] as string).trim().slice(0, max)
  }
  if (typeof out.link === 'string' && !/^https?:\/\//i.test(out.link)) return { ok: false, error: 'link must start with http(s)://' }

  for (const k of DATE_FIELDS) {
    if (!has(k)) continue
    if (blank(b[k])) { if (partial) out[k] = null; continue }
    if (typeof b[k] !== 'string' || !DATE_RE.test(b[k] as string)) return { ok: false, error: `${k} must be YYYY-MM-DD.` }
    out[k] = b[k]
  }

  if (has('billKey')) {
    if (blank(b.billKey)) { if (partial) out.billKey = null }
    else if (typeof b.billKey !== 'string' || !BILL_KEY_RE.test(b.billKey)) return { ok: false, error: 'billKey is invalid.' }
    else out.billKey = b.billKey
  }

  for (const k of ['fee', 'paidAmount'] as const) {
    if (!has(k)) continue
    if (blank(b[k])) { if (partial) out[k] = null; continue }
    const n = Number(b[k])
    if (!Number.isFinite(n) || n < 0) return { ok: false, error: `${k} must be a non-negative number.` }
    out[k] = n
  }

  // Marked paid without an amount → assume the full fee was paid.
  if (out.paymentStatus === 'paid' && out.paidAmount == null && typeof out.fee === 'number') out.paidAmount = out.fee

  if (partial && Object.keys(out).length === 0) return { ok: false, error: 'Nothing to update.' }
  return { ok: true, data: out }
}
