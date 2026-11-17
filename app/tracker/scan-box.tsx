'use client'

import { useEffect, useRef, useState } from 'react'
import type { Worker } from 'tesseract.js'
import { type Extracted, extractMany } from '@/lib/tracker/extract'

// OCR runs entirely in the browser with Tesseract.js. The engine + English and
// Nepali language data (~15 MB) download on first use and are cached by the
// browser afterwards. The worker is kept around so later scans start instantly.
let workerPromise: Promise<Worker> | null = null
let onProgress: ((p: number) => void) | null = null

function getWorker() {
  workerPromise ??= import('tesseract.js').then(({ createWorker }) =>
    createWorker(['eng', 'nep'], 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') onProgress?.(m.progress)
      },
    }),
  )
  workerPromise.catch(() => (workerPromise = null))
  return workerPromise
}

/** OCR an image in the browser; returns the raw text. */
export async function readImageText(file: Blob, progress?: (p: number) => void): Promise<string> {
  const worker = await getWorker()
  onProgress = progress ?? null
  try {
    return (await worker.recognize(file)).data.text
  } finally {
    onProgress = null
  }
}

export function ScanBox({
  onExtract,
  onAddAll,
  onReviewEach,
}: {
  onExtract: (data: Extracted) => void
  /** Only when creating: saves every application found in one go. */
  onAddAll?: (items: Extracted[]) => Promise<void>
  /** Only when creating: open each found application in the form, one after another. */
  onReviewEach?: (items: Extracted[]) => void
}) {
  const [many, setMany] = useState<Extracted[]>([])
  const [adding, setAdding] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<{ kind: 'idle' | 'busy' | 'done' | 'error'; msg?: string }>({ kind: 'idle' })
  const [dragging, setDragging] = useState(false)

  async function scan(file: Blob) {
    if (!file.type.startsWith('image/')) return setState({ kind: 'error', msg: 'That is not an image.' })
    setState({ kind: 'busy', msg: 'Loading OCR engine…' })
    try {
      const text = await readImageText(file, (p) => setState({ kind: 'busy', msg: `Reading screenshot… ${Math.round(p * 100)}%` }))
      const found = extractMany(text)
      setMany(found.length > 1 ? found : [])
      if (found.length > 1) {
        setState({ kind: 'done', msg: `Found ${found.length} applications in this screenshot.` })
      } else if (found.length === 1) {
        const count = Object.keys(found[0]).length
        onExtract(found[0])
        setState({ kind: 'done', msg: `Filled ${count} field${count > 1 ? 's' : ''} — check them before saving.` })
      } else {
        setState({ kind: 'error', msg: 'Read the image but found nothing recognisable. Fill it in manually.' })
      }
    } catch (e) {
      console.error('[scan]', e)
      setState({ kind: 'error', msg: 'Could not read the image (OCR engine failed to load?).' })
    }
  }

  // Ctrl+V a screenshot anywhere while the form is open.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'))
      if (file) {
        e.preventDefault()
        scan(file)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  const busy = state.kind === 'busy'
  const tone = { idle: 'text-ink-muted', busy: 'text-info', done: 'text-accent', error: 'text-warn' }[state.kind]

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) scan(file)
      }}
      className={`rounded-lg border border-dashed p-3 text-sm sm:col-span-2 ${dragging ? 'border-accent bg-accent-soft' : 'border-line-strong'}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-ink-2">
          Auto-fill from a screenshot — drop, paste (Ctrl+V) or
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-line px-2.5 py-1 text-xs text-ink hover:bg-surface-2 disabled:opacity-50"
        >
          Choose image
        </button>
      </div>
      {state.msg && <p className={`mt-2 text-xs ${tone}`} aria-live="polite">{state.msg}</p>}
      {many.length > 1 && (
        <div className="mt-2 space-y-2">
          <ul className="divide-y divide-line rounded-md border border-line">
            {many.map((m, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                <span className="min-w-0">
                  <span className="font-medium text-ink">{m.organization ?? '?'} · {m.position}</span>
                  <span className="block truncate font-mono text-ink-muted">
                    {[m.advertisementNo, m.appliedDate, m.fee ? `Rs ${m.fee}` : null, m.paymentStatus].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => { onExtract(m); setMany([]); setState({ kind: 'done', msg: 'Filled from the selected one — check before saving.' }) }}
                  className="shrink-0 rounded-md border border-line px-2 py-1 text-ink-2 hover:bg-surface-2"
                >
                  Use this one
                </button>
              </li>
            ))}
          </ul>
          {onReviewEach && (
            <button
              type="button"
              onClick={() => onReviewEach(many)}
              className="w-full rounded-md bg-accent px-3 py-2 text-xs font-medium text-accent-ink"
            >
              Review &amp; edit one by one ({many.length})
            </button>
          )}
          {onAddAll && (
            <button
              type="button"
              disabled={adding}
              onClick={async () => {
                setAdding(true)
                try {
                  await onAddAll(many)
                } catch (e) {
                  setState({ kind: 'error', msg: (e as Error).message })
                } finally {
                  setAdding(false)
                }
              }}
              className="w-full rounded-md border border-line px-3 py-2 text-xs text-ink-2 hover:bg-surface-2 disabled:opacity-60"
            >
              {adding ? 'Adding…' : `Add all ${many.length} as-is`}
            </button>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) scan(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
