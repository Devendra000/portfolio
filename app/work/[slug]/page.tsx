import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Footer } from '@/components/site/footer'
import { Header } from '@/components/site/header'
import { ArrowLeft, ArrowRight, ExternalIcon } from '@/components/site/icons'
import { LivePreview } from '@/components/site/live-preview'
import { StatusChip } from '@/components/site/status-chip'
import { caseStudies } from '@/lib/site-config'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const c = caseStudies.find((x) => x.slug === slug)
  return c ? { title: `${c.name} case study`, description: c.summary } : {}
}

function Block({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-line py-10 md:grid-cols-[200px_1fr]" aria-labelledby={`h-${label}`}>
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-accent">{label}</p>
        <h2 id={`h-${label}`} className="mt-1 text-lg font-semibold text-ink">
          {title}
        </h2>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params
  const index = caseStudies.findIndex((c) => c.slug === slug)
  if (index === -1) notFound()
  const c = caseStudies[index]
  const next = caseStudies[(index + 1) % caseStudies.length]

  return (
    <>
      <Header />
      <main id="main" className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6">
        <Link href="/#work" className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted hover:text-ink">
          <ArrowLeft className="size-3.5" /> all case studies
        </Link>

        <header className="pb-10 pt-8">
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-ink-muted">
            <StatusChip status={c.status} />
            <span>{c.year}</span>
            <span>case-study/{c.slug}.md</span>
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{c.name}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-2">{c.summary}</p>
          {(c.demo || c.repo) && (
            <div className="mt-6 flex flex-wrap gap-3">
              {c.demo && (
                <a href={c.demo} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-ink hover:opacity-90">
                  Live demo <ExternalIcon className="size-3.5" />
                </a>
              )}
              {c.repo && (
                <a href={c.repo} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-line-strong px-4 text-sm font-semibold text-ink hover:bg-surface-2">
                  Source <ExternalIcon className="size-3.5" />
                </a>
              )}
            </div>
          )}
        </header>

        <dl className="grid grid-cols-1 gap-3 pb-10 sm:grid-cols-3">
          {c.results.map((r) => (
            <div key={r.label} className="flex flex-col-reverse rounded-xl border border-line bg-surface p-5">
              <dt className="mt-1 text-sm text-ink-muted">{r.label}</dt>
              <dd className="font-mono text-3xl font-medium text-ink">{r.metric}</dd>
            </div>
          ))}
        </dl>

        <Block label="01" title="The problem">
          <p className="text-lg leading-relaxed text-ink-2">{c.problem}</p>
        </Block>

        <Block label="02" title="My role">
          <ul className="flex flex-wrap gap-2">
            {c.role.map((r) => (
              <li key={r} className="rounded-md border border-line px-3 py-1.5 text-sm text-ink-2">
                {r}
              </li>
            ))}
          </ul>
        </Block>

        <Block label="03" title="Tech stack">
          <ul className="flex flex-wrap gap-2">
            {c.stack.map((s) => (
              <li key={s} className="rounded-md bg-surface-2 px-3 py-1.5 font-mono text-sm text-ink-2">
                {s}
              </li>
            ))}
          </ul>
        </Block>

        <Block label="04" title="Decisions & trade-offs">
          <ol className="space-y-4">
            {c.decisions.map((d, i) => (
              <li key={d.decision} className="rounded-xl border border-line bg-surface p-5">
                <p className="font-medium text-ink">
                  <span className="mr-2 font-mono text-xs text-accent">ADR-{String(i + 1).padStart(3, '0')}</span>
                  {d.decision}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">
                  <span className="font-mono text-xs uppercase tracking-wider text-ink-muted">trade-off · </span>
                  {d.tradeoff}
                </p>
              </li>
            ))}
          </ol>
        </Block>

        <Block label="05" title="How I’d rebuild it today">
          <p className="rounded-xl border border-dashed border-line-strong p-5 leading-relaxed text-ink-2">{c.rebuild}</p>
        </Block>

        {c.demo && (
          <Block label="06" title="Live preview">
            <LivePreview url={c.demo} name={c.name} />
          </Block>
        )}

        <nav aria-label="Next case study" className="mt-6 border-t border-line pt-8">
          <Link href={`/work/${next.slug}`} className="group flex items-center justify-between rounded-xl border border-line bg-surface p-5 hover:border-line-strong">
            <span>
              <span className="block font-mono text-xs text-ink-muted">next case study</span>
              <span className="mt-1 block text-lg font-semibold text-ink">{next.name}</span>
            </span>
            <ArrowRight className="text-accent transition-transform group-hover:translate-x-1" />
          </Link>
        </nav>
      </main>
      <Footer />
    </>
  )
}
