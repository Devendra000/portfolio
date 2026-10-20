import { employers, site } from '@/lib/site-config'
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
          <div className="mt-8">
            <p className="font-mono text-xs uppercase tracking-wider text-ink-muted">I’ve worked as a team member at</p>
            <ul className="mt-3 divide-y divide-line rounded-lg border border-line bg-surface font-mono text-sm">
              {employers.map((e) => (
                <li key={e.name} className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <span className="text-ink">{e.name}</span>
                  <span className="shrink-0 text-xs text-ink-muted">{e.years}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-6 rounded-lg border border-line bg-surface px-4 py-3 font-mono text-sm text-ink-2">
            <span className="text-accent">currently building</span> → {site.currentlyBuilding}
            <span className="cursor-blink ml-1 text-accent" aria-hidden>
              ▍
            </span>
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-line bg-surface font-mono text-sm">
          {/* Portrait: background cut out so it sits on the theme instead of a white box. */}
          <figure className="bg-grid relative aspect-square overflow-hidden border-b border-line bg-surface-2">
            <div
              className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,var(--accent-soft),transparent_65%)]"
              aria-hidden
            />
            <img
              src="/profile.webp"
              alt={`Portrait of ${site.name}`}
              width={600}
              height={600}
              decoding="async"
              className="absolute inset-0 h-full w-full object-contain object-bottom"
            />
            <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-surface via-surface/80 to-transparent px-4 pb-3 pt-8 text-xs">
              <span className="text-ink">{site.name.toLowerCase()}</span>
              <span className="text-ink-muted">{site.location.toLowerCase()}</span>
            </figcaption>
          </figure>

          <dl className="space-y-4 p-6">
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
