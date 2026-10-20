'use client'

import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/lib/metrics'

/* Animated request flow: client → edge/CDN → API → data.
   Green dots are requests, blue dots are responses. Some requests are served
   from the edge cache and turn around early.
   SIMULATED: the traffic pattern and cache-hit ratio are illustrative, not
   real traffic. To drive it from real data, replace `spawn()` with events from
   your analytics/log drain (e.g. Vercel Log Drains → a websocket). */

const NODES = [
  { id: 'client', label: 'Client', sub: 'browser', desc: 'Your browser. Static HTML, minimal JS, fonts self-hosted.' },
  { id: 'edge', label: 'Edge / CDN', sub: 'vercel edge', desc: 'Static pages and assets are cached at the edge, close to you.' },
  { id: 'api', label: 'API', sub: 'next.js routes', desc: 'Server routes for health checks and forms. Stateless, scales horizontally.' },
  { id: 'data', label: 'Data', sub: 'postgres · redis', desc: 'Where real client projects keep state. This site itself stays read-only.' },
] as const

const HIT_RATIO = 0.55 // SIMULATED cache-hit ratio
const SEG_MS = 420 // time for a dot to travel one hop
const SPAWN_MS = 650

type Particle = { id: number; born: number; hit: boolean }

type Layout = {
  w: number
  h: number
  vertical: boolean
  nodes: { x: number; y: number }[]
  box: { w: number; h: number }
}

function makeLayout(vertical: boolean): Layout {
  if (vertical) {
    return {
      w: 320,
      h: 420,
      vertical,
      box: { w: 196, h: 58 },
      nodes: NODES.map((_, i) => ({ x: 160, y: 50 + i * 106 })),
    }
  }
  return {
    w: 760,
    h: 160,
    vertical,
    box: { w: 136, h: 64 },
    nodes: NODES.map((_, i) => ({ x: 88 + i * 194.6, y: 80 })),
  }
}

/** Position of a particle at time `t` (ms since birth), or null when finished. */
function particlePos(p: Particle, t: number, L: Layout) {
  const hops = p.hit ? 1 : 3
  const pause = p.hit ? 80 : 160 // time "processing" at the far node
  const out = hops * SEG_MS
  const total = out * 2 + pause
  if (t > total) return null

  let pos: number // 0 = client, 3 = data, fractional in between
  let returning = false
  if (t <= out) pos = (t / out) * hops
  else if (t <= out + pause) pos = hops
  else {
    returning = true
    pos = hops - ((t - out - pause) / out) * hops
  }

  const i = Math.min(Math.floor(pos), 2)
  const f = pos - i
  const a = L.nodes[i]
  const b = L.nodes[i + 1]
  const lane = returning ? 9 : -9
  return {
    x: a.x + (b.x - a.x) * f + (L.vertical ? lane : 0),
    y: a.y + (b.y - a.y) * f + (L.vertical ? 0 : lane),
    returning,
  }
}

export function ArchitectureDiagram() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [vertical, setVertical] = useState(false)
  const [focus, setFocus] = useState<number | null>(null)
  const [frame, setFrame] = useState(0)
  const particles = useRef<Particle[]>([])
  const stats = useRef({ total: 0, hits: 0 })
  const reduced = usePrefersReducedMotion()
  const L = makeLayout(vertical)

  // Switch to a vertical layout on narrow containers so labels stay legible.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setVertical(entry.contentRect.width < 560))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Animation loop — paused when off-screen, tab hidden, or reduced motion.
  useEffect(() => {
    if (reduced) {
      particles.current = []
      return
    }
    let raf = 0
    let visible = true
    let lastSpawn = 0
    let nextId = 0
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    if (wrapRef.current) io.observe(wrapRef.current)

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (!visible || document.hidden) return
      if (now - lastSpawn > SPAWN_MS * (0.6 + Math.random() * 0.8)) {
        lastSpawn = now
        const hit = Math.random() < HIT_RATIO
        particles.current.push({ id: nextId++, born: now, hit })
        stats.current.total++
        if (hit) stats.current.hits++
      }
      particles.current = particles.current.filter((p) => now - p.born < 4000)
      setFrame(now)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [reduced])

  const live = particles.current
    .map((p) => ({ p, pos: particlePos(p, frame - p.born, L) }))
    .filter((x): x is { p: Particle; pos: NonNullable<ReturnType<typeof particlePos>> } => x.pos !== null)

  // Static sample dots so the reduced-motion version still reads as "traffic".
  const staticDots = reduced
    ? [
        { x: 0.5, ret: false },
        { x: 1.4, ret: true },
        { x: 2.5, ret: false },
        { x: 0.3, ret: true },
      ].map(({ x, ret }) => {
        const i = Math.floor(x)
        const f = x - i
        const a = L.nodes[i]
        const b = L.nodes[i + 1]
        const lane = ret ? 9 : -9
        return {
          x: a.x + (b.x - a.x) * f + (L.vertical ? lane : 0),
          y: a.y + (b.y - a.y) * f + (L.vertical ? 0 : lane),
          returning: ret,
        }
      })
    : []

  const hitRate = stats.current.total ? Math.round((stats.current.hits / stats.current.total) * 100) : Math.round(HIT_RATIO * 100)
  const focused = focus !== null ? NODES[focus] : null

  return (
    <div ref={wrapRef} className="w-full">
      <svg
        viewBox={`0 0 ${L.w} ${L.h}`}
        className="h-auto w-full"
        role="img"
        aria-labelledby="arch-title arch-desc"
      >
        <title id="arch-title">Request flow architecture diagram</title>
        <desc id="arch-desc">
          Requests travel from the client to the edge CDN, then to the API, then to the data layer, and responses return
          the same way. About half of requests are served from the edge cache.
        </desc>

        {/* Lanes */}
        {L.nodes.slice(0, -1).map((a, i) => {
          const b = L.nodes[i + 1]
          return (
            <g key={i} stroke="var(--line-strong)" strokeWidth={1.5} strokeDasharray="3 5">
              {L.vertical ? (
                <>
                  <line x1={a.x - 9} y1={a.y} x2={b.x - 9} y2={b.y} />
                  <line x1={a.x + 9} y1={a.y} x2={b.x + 9} y2={b.y} />
                </>
              ) : (
                <>
                  <line x1={a.x} y1={a.y - 9} x2={b.x} y2={b.y - 9} />
                  <line x1={a.x} y1={a.y + 9} x2={b.x} y2={b.y + 9} />
                </>
              )}
            </g>
          )
        })}

        {/* Requests (green) and responses (blue), with a surface ring */}
        {[...live.map((l) => ({ key: l.p.id, ...l.pos })), ...staticDots.map((d, i) => ({ key: `s${i}`, ...d }))].map((d) => (
          <circle
            key={d.key}
            cx={d.x}
            cy={d.y}
            r={4.5}
            fill={d.returning ? 'var(--info)' : 'var(--accent)'}
            stroke="var(--surface)"
            strokeWidth={2}
          />
        ))}

        {/* Nodes */}
        {NODES.map((n, i) => {
          const { x, y } = L.nodes[i]
          const isFocus = focus === i
          return (
            <g
              key={n.id}
              tabIndex={0}
              role="button"
              aria-label={`${n.label}: ${n.desc}`}
              onMouseEnter={() => setFocus(i)}
              onMouseLeave={() => setFocus(null)}
              onFocus={() => setFocus(i)}
              onBlur={() => setFocus(null)}
              className="cursor-default outline-none"
            >
              <rect
                x={x - L.box.w / 2}
                y={y - L.box.h / 2}
                width={L.box.w}
                height={L.box.h}
                rx={10}
                fill="var(--surface-2)"
                stroke={isFocus ? 'var(--accent)' : 'var(--line-strong)'}
                strokeWidth={isFocus ? 2 : 1}
              />
              <circle cx={x - L.box.w / 2 + 16} cy={y - 8} r={3.5} fill="var(--accent)" />
              <text x={x - L.box.w / 2 + 28} y={y - 4} fontSize={15} fontWeight={600} fill="var(--ink)" fontFamily="var(--font-sans)">
                {n.label}
              </text>
              <text x={x - L.box.w / 2 + 16} y={y + 16} fontSize={12} fill="var(--ink-muted)" fontFamily="var(--font-mono)">
                {n.sub}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="mt-3 flex flex-col gap-2 font-mono text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite" className="min-h-4 text-ink-2">
          {focused ? `${focused.label} — ${focused.desc}` : 'Hover or tab to a node for details.'}
        </p>
        <div className="flex shrink-0 items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-accent" aria-hidden /> request
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-info" aria-hidden /> response
          </span>
          <span title="Simulated">edge hit ~{hitRate}%</span>
          {reduced && <span>(motion paused)</span>}
        </div>
      </div>
    </div>
  )
}
