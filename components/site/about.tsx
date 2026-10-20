import { site } from '@/lib/site-config'
import { SectionHeading } from './section-heading'

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-20">
      <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <SectionHeading id="about-title" eyebrow="03 · about" title="Hi, I’m Devendra." />
          {/* TODO(real-data): rewrite in your own voice — two short paragraphs is plenty. */}
          <div className="space-y-4 text-lg leading-relaxed text-ink-2">
            <p>
              I’m a full-stack engineer based in {site.location.split(',')[0]}. I like the unglamorous parts of software —
              the schema that doesn’t need migrating twice, the queue that absorbs a traffic spike, the deploy that nobody
              notices.
            </p>
            <p>
              I work with startups and small teams as a freelancer or contractor: I’ll take a product from a rough idea to
              something running in production, and leave behind code your next engineer will thank you for.
            </p>
          </div>
          <p className="mt-6 rounded-lg border border-line bg-surface px-4 py-3 font-mono text-sm text-ink-2">
            <span className="text-accent">currently building</span> → {site.currentlyBuilding}
            <span className="cursor-blink ml-1 text-accent" aria-hidden>
              ▍
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-6 font-mono text-sm">
          <dl className="space-y-4">
            <div>
              <dt className="text-xs uppercase tracking-wider text-ink-muted">experience</dt>
              <dd className="mt-1 text-ink">{site.yearsExperience}+ years shipping production software</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-ink-muted">engagements</dt>
              <dd className="mt-1 text-ink">freelance · contract · fractional</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-ink-muted">main stack</dt>
              <dd className="mt-2">
                <ul className="flex flex-wrap gap-1.5">
                  {site.stack.map((s) => (
                    <li key={s} className="rounded-md bg-surface-2 px-2 py-1 text-xs text-ink-2">
                      {s}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-ink-muted">timezone</dt>
              <dd className="mt-1 text-ink">UTC+5:45 · overlaps EU mornings & US evenings</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
