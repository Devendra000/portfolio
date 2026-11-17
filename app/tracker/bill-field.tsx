'use client'

import { useRef, useState } from 'react'
import { type Extracted, extractFromText } from '@/lib/tracker/extract'
import { readImageText } from './scan-box'

const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

// Upload a bill / receipt to Cloudflare R2 (via the tracker-bills Worker) and,
// for images, OCR it to pick up the voucher / transaction number and payment.
export function BillField({
  billKey,
  onChange,
  onExtract,
}: {
  billKey: string
  onChange: (key: string) => void
  onExtract: (data: Extracted) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ tone: string; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  async function upload(file: File) {
    if (!TYPES.includes(file.type)) return setMsg({ tone: 'text-warn', text: 'Use a JPG, PNG, WebP or PDF.' })
    if (file.size > 10 * 1024 * 1024) return setMsg({ tone: 'text-warn', text: 'Bill must be under 10 MB.' })
    setBusy(true)
    setMsg({ tone: 'text-info', text: 'Uploading…' })
    try {
      const pre = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type, size: file.size }),
      })
      const data = await pre.json()
      if (!pre.ok) throw new Error(data.error ?? 'Could not start upload')
      const put = await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
      if (!put.ok) throw new Error(`Upload failed (${put.status})`)
      onChange(data.key)

      if (!file.type.startsWith('image/')) {
        setMsg({ tone: 'text-accent', text: 'Bill uploaded. (PDFs aren’t scanned — type the voucher no. yourself.)' })
        return
      }
      setMsg({ tone: 'text-info', text: 'Uploaded. Reading voucher number…' })
      const found = extractFromText(await readImageText(file))
      // A bill means it was paid.
      onExtract({ paymentStatus: 'paid', ...found })
      setMsg({
        tone: 'text-accent',
        text: found.voucherNumber ? `Bill uploaded · voucher ${found.voucherNumber}` : 'Bill uploaded · no voucher number found, type it in.',
      })
    } catch (e) {
      setMsg({ tone: 'text-danger', text: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-1 sm:col-span-2">
      <span className="text-xs text-ink-muted">Bill / receipt</span>
      <input type="hidden" name="billKey" value={billKey} />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-line px-2.5 py-1.5 text-xs text-ink hover:bg-surface-2 disabled:opacity-50"
        >
          {billKey ? 'Replace bill' : 'Upload bill'}
        </button>
        {billKey && (
          <>
            <a href={`/api/${billKey}`} target="_blank" rel="noreferrer" className="text-xs text-info hover:underline">
              View bill
            </a>
            <button type="button" onClick={() => { onChange(''); setMsg(null) }} className="text-xs text-danger hover:underline">
              Remove
            </button>
          </>
        )}
      </div>
      {msg && <p className={`text-xs ${msg.tone}`} aria-live="polite">{msg.text}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={TYPES.join(',')}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) upload(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
