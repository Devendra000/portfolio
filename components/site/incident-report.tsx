'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { openCommandPalette } from './header'
import { AlertIcon } from './icons'

export function IncidentReport() {
  const [path, setPath] = useState('/unknown')
  const [detected, setDetected] = useState('')
  const [id, setId] = useState('INC-404')

  useEffect(() => {
    setPath(window.location.pathname)
    const now = new Date()
    setDetected(now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC')
    setId(`INC-404-${now.getTime().toString(36).slice(-5).toUpperCase()}`)
  }, [])

  const timeline = [
    { t: 'T+0ms', e: `GET ${path} received at the edge` },
    { t: 'T+3ms', e: 'Route table consulted. Route table shrugged.' },
    { t: 'T+4ms', e: 'Search party dispatched to /pages, /app and behind the sofa' },
    { t: 'T+5ms', e: 'Page declared missing. Incident opened. Coffee requested.' },
  ]

  return (
    <article className="mx-auto max-w-3xl" aria-labelledby="incident-title">
      <div className="overflow-hidden rounded-xl border border-line bg-surface">
        <header className="border-b border-line bg-surface-2 px-6 py-5">
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warn/40 bg-warn/10 px-2.5 py-1 text-warn">
              <AlertIcon className="size-3.5" /> SEV-4 · minor
            </span>
            <span className="text-ink-muted">{id}</span>
            <span className="text-ink-muted">status: investigating (not very hard)</span>
          </div>
          <h1 id="incident-title" className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Incident report: page not found
          </h1>
          <p className="mt-2 text-ink-2">
            The resource you requested does not exist. All other systems remain operational.
          </p>
        </header>

        <dl className="grid gap-px bg-line sm:grid-cols-3">
          {[
            ['affected path', path],
            ['detected', detected || '—'],
            ['impact', '1 curious visitor (you)'],
          ].map(([k, v]) => (
            <div key={k} className="bg-surface px-6 py-4">
              <dt className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">{k}</dt>
              <dd className="mt-1 break-all font-mono text-sm text-ink">{v}</dd>
            </div>
          ))}
        </dl>

        <section className="px-6 py-6" aria-labelledby="timeline-title">
          <h2 id="timeline-title" className="font-mono text-xs uppercase tracking-wider text-ink-muted">
            timeline
          </h2>
          <ol className="mt-4 space-y-3 border-l border-line pl-5">
            {timeline.map((row) => (
              <li key={row.t} className="relative font-mono text-sm">
                <span className="absolute -left-[25px] top-1.5 size-2 rounded-full bg-warn" aria-hidden />
                <span className="text-ink-muted">{row.t}</span> <span className="text-ink-2">{row.e}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-line px-6 py-6" aria-labelledby="root-cause-title">
          <h2 id="root-cause-title" className="font-mono text-xs uppercase tracking-wider text-ink-muted">
            probable root cause
          </h2>
          <p className="mt-2 text-ink-2">
            A mistyped URL, an outdated link, or a page that was refactored out of existence. No data was lost. No
            engineers were harmed.
          </p>
        </section>

        <section className="border-t border-line px-6 py-6" aria-labelledby="remediation-title">
          <h2 id="remediation-title" className="font-mono text-xs uppercase tracking-wider text-ink-muted">
            remediation
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/" className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-ink hover:opacity-90">
              Roll back to homepage
            </Link>
            <Link href="/#work" className="inline-flex h-10 items-center rounded-lg border border-line-strong px-4 text-sm font-semibold text-ink hover:bg-surface-2">
              View case studies
            </Link>
            <button
              type="button"
              onClick={openCommandPalette}
              className="inline-flex h-10 items-center rounded-lg border border-line-strong px-4 text-sm font-semibold text-ink hover:bg-surface-2"
            >
              Search (⌘K)
            </button>
          </div>
        </section>
      </div>
    </article>
  )
}
