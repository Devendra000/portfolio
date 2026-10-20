import type { CaseStudy } from '@/lib/site-config'

const styles: Record<CaseStudy['status'], { label: string; dot: string }> = {
  live: { label: 'live', dot: 'bg-accent' },
  'in-progress': { label: 'in progress', dot: 'bg-warn' },
  archived: { label: 'archived', dot: 'bg-ink-muted' },
}

export function StatusChip({ status }: { status: CaseStudy['status'] }) {
  const s = styles[status]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2 py-0.5 font-mono text-[11px] text-ink-2">
      <span className={`size-1.5 rounded-full ${s.dot}`} aria-hidden />
      {s.label}
    </span>
  )
}
