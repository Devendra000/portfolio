'use client'

import { useState } from 'react'
import { ExternalIcon } from './icons'

/* Click-to-load preview so third-party pages don't slow down the case study.
   Some sites block embedding (X-Frame-Options); the link always works. */
export function LivePreview({ url, name }: { url: string; name: string }) {
  const [loaded, setLoaded] = useState(false)
  const host = url.replace(/^https?:\/\//, '').replace(/\/$/, '')

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
          <span className="size-2.5 rounded-full bg-line-strong" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded bg-bg px-3 py-1 font-mono text-xs text-ink-muted">{host}</span>
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-xs text-accent hover:underline">
          open <ExternalIcon className="size-3" />
          <span className="sr-only">{name} in a new tab</span>
        </a>
      </div>
      <div className="relative aspect-[16/10] w-full bg-bg">
        {loaded ? (
          <iframe src={url} title={`Live preview of ${name}`} className="absolute inset-0 h-full w-full" loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
        ) : (
          <div className="bg-grid absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <button
              type="button"
              onClick={() => setLoaded(true)}
              className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-ink hover:opacity-90"
            >
              Load interactive preview
            </button>
            <p className="max-w-xs text-xs text-ink-muted">Loads {host} inside this page. If it stays blank, the site blocks embedding — use “open”.</p>
          </div>
        )}
      </div>
    </div>
  )
}
