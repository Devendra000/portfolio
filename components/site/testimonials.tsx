import { testimonials } from '@/lib/site-config'
import { SectionHeading } from './section-heading'

export function Testimonials() {
  return (
    <section id="testimonials" aria-labelledby="testimonials-title" className="scroll-mt-20">
      <SectionHeading id="testimonials-title" eyebrow="04 · signal" title="What clients say." />
      <ul className="grid gap-4 md:grid-cols-2">
        {testimonials.map((t, i) => (
          <li key={i} className="flex flex-col rounded-xl border border-line bg-surface p-6">
            <figure className="flex h-full flex-col">
              <blockquote className={`text-lg leading-relaxed ${t.isPlaceholder ? 'text-ink-muted italic' : 'text-ink'}`}>
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-auto flex items-center justify-between gap-2 pt-6">
                <span>
                  <span className="block font-medium text-ink">{t.name}</span>
                  <span className="block text-sm text-ink-muted">{t.title}</span>
                </span>
                {t.isPlaceholder && (
                  <span className="rounded border border-dashed border-line-strong px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                    placeholder
                  </span>
                )}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  )
}
