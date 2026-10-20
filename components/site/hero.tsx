import Link from 'next/link'
import { site } from '@/lib/site-config'
import { ArrowRight } from './icons'
import { Terminal } from './terminal'

export function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative scroll-mt-20 pb-20 pt-16 sm:pt-24">
      <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <Link
            href="#system"
            className="inline-flex items-center gap-2.5 rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-xs text-ink-2 transition-colors hover:border-line-strong"
          >
            <span className="status-dot" aria-hidden />
            <span>
              system status: <span className="text-accent">all systems operational</span>
            </span>
          </Link>

          <h1 id="hero-title" className="mt-6 text-4xl font-semibold tracking-tight text-ink sm:text-6xl">
            {site.name}
            <span className="mt-3 block text-ink-muted">{site.tagline}</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">{site.intro}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="#work"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90"
            >
              View case studies <ArrowRight />
            </Link>
            <Link
              href="#contact"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-line-strong bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
            >
              Hire me
            </Link>
          </div>

          <p className="mt-6 font-mono text-xs text-ink-muted">
            {site.availability} · press <kbd className="rounded border border-line px-1">⌘K</kbd> to navigate, or type{' '}
            <span className="text-accent">help</span> in the terminal
          </p>
        </div>

        {/* Fully interactive, sandboxed terminal — try `help`. */}
        <div className="min-w-0">
          <Terminal />
        </div>
      </div>
    </section>
  )
}
