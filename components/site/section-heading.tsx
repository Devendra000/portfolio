export function SectionHeading({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8">
      <p className="font-mono text-xs uppercase tracking-wider text-accent">{eyebrow}</p>
      <h2 id={id} className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {children && <p className="mt-3 max-w-xl text-ink-2">{children}</p>}
    </div>
  )
}
