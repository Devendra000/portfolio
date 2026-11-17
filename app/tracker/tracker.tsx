'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'
import type { Extracted } from '@/lib/tracker/extract'
import { BillField } from './bill-field'
import { ScanBox } from './scan-box'
import {
  type Application,
  ORGANIZATIONS,
  type PaymentStatus,
  STATUS_LABELS,
  STATUSES,
  type Status,
} from '@/lib/tracker/schema'

const input = 'w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent'

const STATUS_TONE: Partial<Record<Status, string>> = {
  selected: 'text-accent',
  rejected: 'text-danger',
  withdrawn: 'text-ink-muted',
  interview: 'text-info',
  shortlisted: 'text-info',
  written_exam: 'text-warn',
  admit_card: 'text-warn',
}

const npr = (n: number) => `Rs ${n.toLocaleString('en-IN')}`
const isPaid = (a: Application) => a.paymentStatus === 'paid'

const orgName = (a: Application) => (a.organization === 'Other' ? a.organizationOther || 'Other' : a.organization)

async function api(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`)
  return data
}

export function Tracker({ initial }: { initial: Application[] }) {
  const router = useRouter()
  const [apps, setApps] = useState(initial)
  const [editing, setEditing] = useState<Application | 'new' | null>(null)
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const [payFilter, setPayFilter] = useState<PaymentStatus | 'all'>('all')
  const [error, setError] = useState('')
  // Several applications detected in one screenshot, reviewed one at a time.
  const [queue, setQueue] = useState<{ items: Extracted[]; index: number } | null>(null)

  const shown = useMemo(
    () =>
      apps.filter(
        (a) =>
          (filter === 'all' || a.status === filter) &&
          (payFilter === 'all' || (payFilter === 'paid') === isPaid(a)),
      ),
    [apps, filter, payFilter],
  )
  const money = useMemo(() => {
    const paid = apps.filter(isPaid)
    // Withdrawn ones don't count as "still to pay".
    const unpaid = apps.filter((a) => !isPaid(a) && a.status !== 'withdrawn')
    return {
      paidCount: paid.length,
      paidTotal: paid.reduce((s, a) => s + (a.paidAmount ?? a.fee ?? 0), 0),
      unpaidCount: unpaid.length,
      unpaidTotal: unpaid.reduce((s, a) => s + (a.fee ?? 0), 0),
    }
  }, [apps])
  const counts = useMemo(() => {
    const c: Partial<Record<Status, number>> = {}
    for (const a of apps) c[a.status] = (c[a.status] ?? 0) + 1
    return c
  }, [apps])

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = apps
    .flatMap((a) => [
      a.status === 'planned' && a.deadline ? { a, what: 'Deadline', date: a.deadline } : null,
      a.examDate && ['applied', 'admit_card', 'written_exam'].includes(a.status) ? { a, what: 'Exam', date: a.examDate } : null,
      a.interviewDate && ['shortlisted', 'interview'].includes(a.status) ? { a, what: 'Interview', date: a.interviewDate } : null,
    ])
    .filter((x): x is { a: Application; what: string; date: string } => !!x && x.date >= today)
    .sort((x, y) => x.date.localeCompare(y.date))
    .slice(0, 5)

  async function save(form: HTMLFormElement) {
    setError('')
    const fd = new FormData(form)
    const body = Object.fromEntries([...fd.entries()].map(([k, v]) => [k, String(v)]))
    try {
      if (editing === 'new') {
        const { application } = await api('/api/applications', 'POST', body)
        setApps((xs) => [application, ...xs])
        if (nextInQueue()) return
      } else if (editing) {
        const { application } = await api(`/api/applications/${editing.id}`, 'PATCH', body)
        setApps((xs) => xs.map((x) => (x.id === application.id ? application : x)))
      }
      closeEditor()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  /** Move to the next queued application. Returns false when the queue is done. */
  function nextInQueue() {
    if (queue && queue.index + 1 < queue.items.length) {
      setQueue({ ...queue, index: queue.index + 1 })
      setError('')
      return true
    }
    return false
  }

  function closeEditor() {
    setEditing(null)
    setQueue(null)
    setError('')
  }

  // From a screenshot listing several applications: save them all at once.
  async function addMany(items: Extracted[]) {
    setError('')
    const created: Application[] = []
    for (const item of items) {
      const { application } = await api('/api/applications', 'POST', { organization: 'Other', status: 'applied', ...item })
      created.push(application)
    }
    setApps((xs) => [...created, ...xs])
    closeEditor()
  }

  async function setStatus(a: Application, status: Status) {
    setError('')
    try {
      const { application } = await api(`/api/applications/${a.id}`, 'PATCH', { status })
      setApps((xs) => xs.map((x) => (x.id === application.id ? application : x)))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function togglePaid(a: Application) {
    setError('')
    const body = isPaid(a)
      ? confirm(`Mark ${orgName(a)} — ${a.position} as UNPAID?`) && { paymentStatus: 'unpaid', paidAmount: '', paidDate: '' }
      : { paymentStatus: 'paid', paidAmount: a.paidAmount ?? a.fee ?? '', paidDate: a.paidDate ?? new Date().toISOString().slice(0, 10) }
    if (!body) return
    try {
      const { application } = await api(`/api/applications/${a.id}`, 'PATCH', body)
      setApps((xs) => xs.map((x) => (x.id === application.id ? application : x)))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function remove(a: Application) {
    if (!confirm(`Delete ${orgName(a)} — ${a.position}?`)) return
    try {
      await api(`/api/applications/${a.id}`, 'DELETE')
      setApps((xs) => xs.filter((x) => x.id !== a.id))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-ink-muted">~/tracker</p>
          <h1 className="text-2xl font-semibold text-ink">Job applications</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing('new')} className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-ink">
            + Add application
          </button>
          <button onClick={logout} className="rounded-lg border border-line px-3 py-2 text-sm text-ink-2 hover:bg-surface-2">
            Log out
          </button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-lg border border-danger/40 px-3 py-2 text-sm text-danger">{error}</p>}

      <section className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => setPayFilter(payFilter === 'paid' ? 'all' : 'paid')}
          className={`rounded-xl border bg-surface p-4 text-left ${payFilter === 'paid' ? 'border-accent' : 'border-line hover:border-line-strong'}`}
        >
          <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">Total paid</p>
          <p className="mt-1 text-2xl font-semibold text-accent">{npr(money.paidTotal)}</p>
          <p className="text-xs text-ink-2">{money.paidCount} application{money.paidCount === 1 ? '' : 's'} paid</p>
        </button>
        <button
          onClick={() => setPayFilter(payFilter === 'unpaid' ? 'all' : 'unpaid')}
          className={`rounded-xl border bg-surface p-4 text-left ${payFilter === 'unpaid' ? 'border-warn' : 'border-line hover:border-line-strong'}`}
        >
          <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">Not paid yet</p>
          <p className={`mt-1 text-2xl font-semibold ${money.unpaidCount ? 'text-warn' : 'text-ink'}`}>{money.unpaidCount}</p>
          <p className="text-xs text-ink-2">{money.unpaidTotal ? `${npr(money.unpaidTotal)} in fees still to pay` : 'Nothing pending'}</p>
        </button>
      </section>

      {upcoming.length > 0 && (
        <section className="rounded-xl border border-line bg-surface p-4">
          <h2 className="font-mono text-xs uppercase tracking-wide text-ink-muted">Coming up</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {upcoming.map(({ a, what, date }) => (
              <li key={a.id + what} className="flex justify-between gap-3">
                <span className="text-ink">{orgName(a)} — {a.position}</span>
                <span className="shrink-0 font-mono text-ink-2">{what} · {date}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap gap-2 text-xs">
        {(['all', 'unpaid', 'paid'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPayFilter(p)}
            className={`rounded-full border px-3 py-1 ${payFilter === p ? 'border-accent bg-accent-soft text-ink' : 'border-line text-ink-2 hover:bg-surface-2'}`}
          >
            {p === 'all' ? 'Any payment' : p === 'paid' ? 'Paid' : 'Unpaid'}
          </button>
        ))}
        <span className="mx-1 w-px self-stretch bg-line" aria-hidden />
        {(['all', ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1 ${filter === s ? 'border-accent bg-accent-soft text-ink' : 'border-line text-ink-2 hover:bg-surface-2'}`}
          >
            {s === 'all' ? `All (${apps.length})` : `${STATUS_LABELS[s]} (${counts[s] ?? 0})`}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-surface-2 font-mono text-xs text-ink-muted">
            <tr>
              <th className="px-3 py-2">Org</th>
              <th className="px-3 py-2">Position</th>
              <th className="px-3 py-2">Adv. no</th>
              <th className="px-3 py-2">Applied</th>
              <th className="px-3 py-2">Exam</th>
              <th className="px-3 py-2">Payment</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-ink-muted">No applications yet.</td>
              </tr>
            )}
            {shown.map((a) => (
              <tr key={a.id} className="border-t border-line bg-surface align-top">
                <td className="px-3 py-2 font-medium text-ink">{orgName(a)}</td>
                <td className="px-3 py-2 text-ink">
                  {a.link ? <a href={a.link} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">{a.position}</a> : a.position}
                  {a.level && <div className="text-xs text-ink-muted">{a.level}</div>}
                </td>
                <td className="px-3 py-2 font-mono text-ink-2">{a.advertisementNo ?? '—'}</td>
                <td className="px-3 py-2 font-mono text-ink-2">{a.appliedDate ?? '—'}</td>
                <td className="px-3 py-2 font-mono text-ink-2">{a.examDate ?? '—'}</td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => togglePaid(a)}
                    title={isPaid(a) ? 'Click to mark unpaid' : 'Click to mark paid'}
                    className={`rounded-md border px-2 py-0.5 text-xs font-medium ${isPaid(a) ? 'border-accent/40 bg-accent-soft text-accent' : 'border-warn/40 text-warn'}`}
                  >
                    {isPaid(a) ? 'PAID' : 'UNPAID'}
                  </button>
                  <div className="mt-0.5 font-mono text-xs text-ink-muted">
                    {isPaid(a)
                      ? [npr(a.paidAmount ?? a.fee ?? 0), a.paymentMethod].filter(Boolean).join(' · ')
                      : a.fee ? `${npr(a.fee)} due` : ''}
                  </div>
                  {(a.voucherNumber || a.billKey) && (
                    <div className="mt-0.5 flex items-center gap-2 font-mono text-xs text-ink-muted">
                      {a.voucherNumber && <span title="Voucher / transaction no.">#{a.voucherNumber}</span>}
                      {a.billKey && <a href={`/api/${a.billKey}`} target="_blank" rel="noreferrer" className="text-info hover:underline">bill</a>}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={a.status}
                    onChange={(e) => setStatus(a, e.target.value as Status)}
                    className={`rounded-md border border-line bg-bg px-2 py-1 text-xs ${STATUS_TONE[a.status] ?? 'text-ink'}`}
                    aria-label="Status"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-xs">
                  <button onClick={() => setEditing(a)} className="text-ink-2 hover:text-ink">Edit</button>
                  <button onClick={() => remove(a)} className="ml-3 text-danger hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={closeEditor}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => { e.preventDefault(); save(e.currentTarget) }}
            className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-xl border border-line bg-surface p-5"
          >
            <ApplicationEditor
              // Remount per queued item so each starts from its own detected values.
              key={queue ? `queue-${queue.index}` : 'single'}
              app={editing === 'new' ? undefined : editing}
              prefill={queue?.items[queue.index]}
              step={queue ? { current: queue.index + 1, total: queue.items.length } : undefined}
              onAddAll={editing === 'new' ? addMany : undefined}
              onReviewEach={editing === 'new' ? (items) => setQueue({ items, index: 0 }) : undefined}
            />
            {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={closeEditor} className="rounded-lg border border-line px-3 py-2 text-sm text-ink-2">Cancel</button>
              {queue && (
                <button type="button" onClick={() => nextInQueue() || closeEditor()} className="rounded-lg border border-line px-3 py-2 text-sm text-ink-2 hover:bg-surface-2">
                  Skip
                </button>
              )}
              <button type="submit" className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-ink">
                {queue && queue.index + 1 < queue.items.length ? 'Save & next' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block space-y-1 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="text-xs text-ink-muted">{label}</span>
      {children}
    </label>
  )
}

// Wraps the fields with the screenshot scanner. A scan merges into what's
// already typed (fills empty fields, appends notes) and remounts the inputs.
function ApplicationEditor({
  app,
  prefill,
  step,
  onAddAll,
  onReviewEach,
}: {
  app?: Application
  prefill?: Extracted
  step?: { current: number; total: number }
  onAddAll?: (items: Extracted[]) => Promise<void>
  onReviewEach?: (items: Extracted[]) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [values, setValues] = useState<Partial<Application>>(app ?? prefill ?? {})
  const [version, setVersion] = useState(0)
  // Lives here (not in ApplicationFields) so a scan-triggered remount keeps it.
  const [billKey, setBillKey] = useState(app?.billKey ?? '')

  function merge(found: Extracted) {
    const form = ref.current?.closest('form')
    const current: Record<string, string> = form
      ? Object.fromEntries([...new FormData(form).entries()].map(([k, v]) => [k, String(v)]))
      : {}
    const next: Record<string, unknown> = { ...current }
    for (const [k, v] of Object.entries(found)) {
      if (k === 'billKey') continue
      if (k === 'notes') next.notes = [current.notes, v].filter(Boolean).join('\n')
      else if (!current[k] || (k === 'status' && current[k] === 'applied') || (k === 'paymentStatus' && current[k] === 'unpaid') || (k === 'organization' && !app)) next[k] = v
    }
    setValues(next as Partial<Application>)
    setVersion((n) => n + 1)
  }

  return (
    <div ref={ref} className="grid gap-3 sm:grid-cols-2">
      <h2 className="flex items-baseline justify-between gap-3 text-lg font-semibold text-ink sm:col-span-2">
        {app ? 'Edit application' : 'New application'}
        {step && <span className="font-mono text-xs font-normal text-info">from screenshot · {step.current} of {step.total}</span>}
      </h2>
      {!step && <ScanBox onExtract={merge} onAddAll={onAddAll} onReviewEach={onReviewEach} />}
      <ApplicationFields key={version} app={values} />
      <BillField billKey={billKey} onChange={setBillKey} onExtract={merge} />
    </div>
  )
}

function ApplicationFields({ app }: { app: Partial<Application> }) {
  const [org, setOrg] = useState(app?.organization ?? 'PSC')
  return (
    <>
      <Field label="Organization *">
        <select name="organization" value={org} onChange={(e) => setOrg(e.target.value as typeof org)} className={input}>
          {ORGANIZATIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
      </Field>
      {org === 'Other' ? (
        <Field label="Organization name">
          <input name="organizationOther" defaultValue={app?.organizationOther} className={input} />
        </Field>
      ) : <div className="hidden sm:block" />}
      <Field label="Position *"><input name="position" required defaultValue={app?.position} placeholder="Assistant" className={input} /></Field>
      <Field label="Level / service"><input name="level" defaultValue={app?.level} placeholder="Officer, 6th level" className={input} /></Field>
      <Field label="Advertisement no."><input name="advertisementNo" defaultValue={app?.advertisementNo} placeholder="12/082-83" className={input} /></Field>
      <Field label="Roll number"><input name="rollNumber" defaultValue={app?.rollNumber} className={input} /></Field>
      <Field label="Status">
        <select name="status" defaultValue={app?.status ?? 'applied'} className={input}>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </Field>
      <Field label="Applied on"><input name="appliedDate" type="date" defaultValue={app?.appliedDate} className={input} /></Field>
      <Field label="Deadline"><input name="deadline" type="date" defaultValue={app?.deadline} className={input} /></Field>
      <Field label="Exam date"><input name="examDate" type="date" defaultValue={app?.examDate} className={input} /></Field>
      <Field label="Interview date"><input name="interviewDate" type="date" defaultValue={app?.interviewDate} className={input} /></Field>
      <Field label="Exam fee (NPR)"><input name="fee" type="number" min="0" step="any" defaultValue={app?.fee} className={input} /></Field>
      <Field label="Payment">
        <select name="paymentStatus" defaultValue={app?.paymentStatus ?? 'unpaid'} className={input}>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
        </select>
      </Field>
      <Field label="Amount paid (NPR)"><input name="paidAmount" type="number" min="0" step="any" defaultValue={app?.paidAmount} placeholder="defaults to the fee" className={input} /></Field>
      <Field label="Paid on"><input name="paidDate" type="date" defaultValue={app?.paidDate} className={input} /></Field>
      <Field label="Paid via"><input name="paymentMethod" defaultValue={app?.paymentMethod} placeholder="Khalti, eSewa, ConnectIPS…" className={input} /></Field>
      <Field label="Voucher / transaction no."><input name="voucherNumber" defaultValue={app?.voucherNumber} className={`${input} font-mono`} /></Field>
      <Field label="Notice link" wide><input name="link" type="url" defaultValue={app?.link} placeholder="https://…" className={input} /></Field>
      <Field label="Notes" wide><textarea name="notes" rows={3} defaultValue={app?.notes} className={input} /></Field>
    </>
  )
}
