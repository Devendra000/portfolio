import Link from 'next/link'
import { caseStudies } from '@/lib/site-config'
import { ArrowRight, ExternalIcon } from './icons'
import { SectionHeading } from './section-heading'
import { StatusChip } from './status-chip'

export function CaseStudies() {
  return (
    <section id="work" aria-labelledby="work-title" className="scroll-mt-20">
      <SectionHeading id="work-title" eyebrow="02 · case-study lab" title="Case studies, not screenshots.">
        Each project is written up like a postmortem: the problem, the decisions, the trade-offs, and what I’d change.
      </SectionHeading>

      <ul className="grid gap-4 md:grid-cols-2">
        {caseStudies.map((c) => (
          <li key={c.slug} className="group relative flex flex-col rounded-xl border border-line bg-surface p-6 transition-colors hover:border-line-strong">
            <div className="flex items-center justify-between gap-2">
              <StatusChip status={c.status} />
              <span className="font-mono text-xs text-ink-muted">{c.year}</span>
            </div>
            <h3 className="mt-4 text-xl font-semibold text-ink">
              <Link href={`/work/${c.slug}`} className="after:absolute after:inset-0 after:rounded-xl">
                {c.name}
              </Link>
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">{c.summary}</p>

            <dl className="mt-5 grid grid-cols-3 gap-2 border-y border-line py-4">
              {c.results.map((r) => (
                <div key={r.label}>
                  <dt className="sr-only">{r.label}</dt>
                  <dd className="font-mono text-lg font-medium text-ink">{r.metric}</dd>
                  <dd className="mt-0.5 text-[11px] leading-snug text-ink-muted">{r.label}</dd>
                </div>
              ))}
            </dl>

            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tech stack">
              {c.stack.map((s) => (
                <li key={s} className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-ink-2">
                  {s}
                </li>
              ))}
            </ul>

            <div className="mt-auto flex items-center justify-between pt-6 text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium text-accent">
                Read case study <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </span>
              {c.demo && (
                <a
                  href={c.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative z-10 inline-flex items-center gap-1 font-mono text-xs text-ink-muted hover:text-ink"
                >
                  live demo <ExternalIcon className="size-3" />
                  <span className="sr-only">for {c.name} (opens in new tab)</span>
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
