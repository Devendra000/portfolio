'use client'

import { useEffect, useMemo, useState } from 'react'
import { deploy, getSimulatedUptime, timeAgo, useResponseTimes, useServingRegion } from '@/lib/metrics'
import { ArchitectureDiagram } from './architecture-diagram'
import { CheckIcon } from './icons'

function Panel({ title, tag, children, className = '' }: { title: string; tag?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col rounded-xl border border-line bg-surface p-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-mono text-xs uppercase tracking-wider text-ink-muted">{title}</h3>
        {tag && (
          <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            {tag}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

/* ---------- Uptime ---------- */

function UptimePanel() {
  const uptime = useMemo(getSimulatedUptime, [])
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover !== null ? uptime.days[hover] : null

  return (
    <Panel title="Uptime · 90 days" tag={uptime.simulated ? 'demo data' : undefined}>
      <p className="font-mono text-3xl font-medium text-ink">{uptime.percent.toFixed(2)}%</p>
      <div className="mt-4 flex h-8 items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
        {uptime.days.map((d, i) => (
          <span
            key={d.date}
            onMouseEnter={() => setHover(i)}
            className={`h-full min-w-0 flex-1 rounded-[2px] transition-opacity ${
              d.status === 'operational' ? 'bg-accent' : d.status === 'degraded' ? 'bg-warn' : 'bg-danger'
            } ${hover !== null && hover !== i ? 'opacity-40' : 'opacity-90'}`}
            aria-hidden
          />
        ))}
      </div>
      <p className="mt-2 min-h-4 font-mono text-[11px] text-ink-muted" aria-live="polite">
        {shown ? `${shown.date} · ${shown.status}` : '90 days ago → today'}
      </p>
      <p className="sr-only">
        {uptime.days.filter((d) => d.status !== 'operational').length} day(s) with degraded service in the last 90 days.
      </p>
    </Panel>
  )
}

/* ---------- Response time ---------- */

function Sparkline({ samples }: { samples: number[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const W = 240
  const H = 48
  if (samples.length < 2) {
    return <div className="h-12 animate-pulse rounded-md bg-surface-2" aria-hidden />
  }
  const max = Math.max(...samples) * 1.15
  const min = 0
  const step = W / (samples.length - 1)
  const pts = samples.map((v, i) => [i * step, H - ((v - min) / (max - min)) * H] as const)
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const h = hover !== null ? pts[hover] : null

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-12 w-full overflow-visible"
        aria-hidden
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          const i = Math.round(((e.clientX - r.left) / r.width) * (samples.length - 1))
          setHover(Math.max(0, Math.min(samples.length - 1, i)))
        }}
        onPointerLeave={() => setHover(null)}
      >
        <path d={`${d} L${W},${H} L0,${H} Z`} fill="var(--accent-soft)" />
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {h && <line x1={h[0]} x2={h[0]} y1={0} y2={H} stroke="var(--line-strong)" vectorEffect="non-scaling-stroke" />}
      </svg>
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink"
          style={{ left: `${(h[0] / W) * 100}%` }}
        >
          {samples[hover]} ms
        </div>
      )}
    </div>
  )
}

function ResponsePanel() {
  const { samples, avg, failed } = useResponseTimes()
  return (
    <Panel title="Avg response time" tag="from your browser">
      <p className="font-mono text-3xl font-medium text-ink">
        {avg !== null ? (
          <>
            {avg}
            <span className="ml-1 text-base text-ink-muted">ms</span>
          </>
        ) : failed ? (
          <span className="text-xl text-ink-muted">unavailable</span>
        ) : (
          <span className="text-xl text-ink-muted">measuring…</span>
        )}
      </p>
      <div className="mt-4">
        <Sparkline samples={samples} />
      </div>
      <p className="mt-2 font-mono text-[11px] text-ink-muted">
        {samples.length ? `last ${samples.length} pings · every 5s` : 'pinging /api/health'}
      </p>
    </Panel>
  )
}

/* ---------- Deploy ---------- */

function DeployPanel() {
  // Render relative time on the client only to avoid hydration mismatches.
  const [ago, setAgo] = useState<string | null>(null)
  const region = useServingRegion()
  useEffect(() => {
    const update = () => setAgo(timeAgo(deploy.time))
    update()
    const t = setInterval(update, 30_000)
    return () => clearInterval(t)
  }, [])

  return (
    <Panel title="Last deploy" className="sm:col-span-2 lg:col-span-1">
      <p className="font-mono text-3xl font-medium text-ink">{ago ?? '—'}</p>
      <dl className="mt-4 space-y-1 font-mono text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-ink-muted">built</dt>
          <dd className="text-ink-2">{deploy.time ? new Date(deploy.time).toUTCString().slice(5, 22) + ' UTC' : 'unknown'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-ink-muted">env</dt>
          <dd className="text-ink-2">{deploy.env ?? 'local'}</dd>
        </div>
        {region && (
          <div className="flex justify-between gap-2">
            <dt className="text-ink-muted">region</dt>
            <dd className="text-ink-2">{region}</dd>
          </div>
        )}
      </dl>
    </Panel>
  )
}

/* ---------- Section ---------- */

export function StatusDashboard() {
  return (
    <section id="system" aria-labelledby="system-title" className="scroll-mt-20">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-accent">01 · live system</p>
          <h2 id="system-title" className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            This site is a running system.
          </h2>
          <p className="mt-3 max-w-xl text-ink-2">
            The same things I watch on client projects: uptime, latency and deploys.
          </p>
        </div>
        <p className="inline-flex items-center gap-2 self-start rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-xs text-ink-2 sm:self-auto">
          <CheckIcon className="size-3.5 text-accent" /> All systems operational
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <UptimePanel />
        <ResponsePanel />
        <DeployPanel />
        <Panel title="Request flow" tag="simulated traffic" className="sm:col-span-2 lg:col-span-3">
          <ArchitectureDiagram />
        </Panel>
      </div>
    </section>
  )
}

