'use client'

import { useEffect, useState } from 'react'

/* =============================================================================
   Metrics for the "Live system" dashboard.

   REAL      — measured or fetched for real right now.
   SIMULATED — fake but plausible numbers. Each one is marked with
               `SIMULATED:` and tells you what to wire it up to.
   ========================================================================== */

/* ---------- Uptime ---------------------------------------------------------- */

export type DayStatus = 'operational' | 'degraded' | 'outage'
export type UptimeData = { percent: number; days: { date: string; status: DayStatus }[]; simulated: boolean }

// SIMULATED: uptime % and 90-day history are generated here.
// To make it real: create a free monitor at https://uptimerobot.com, then call
// `POST https://api.uptimerobot.com/v2/getMonitors` with
// `custom_uptime_ratios=90` and `response_times=1` from a server route
// (keep the API key server-side, e.g. app/api/uptime/route.ts) and return
// the same `UptimeData` shape. Set `simulated: false` when you do.
export function getSimulatedUptime(): UptimeData {
  const days: UptimeData['days'] = []
  const today = new Date()
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    // Deterministic, so server and client render the same bars.
    const status: DayStatus = i === 41 ? 'degraded' : 'operational'
    days.push({ date: d.toISOString().slice(0, 10), status })
  }
  return { percent: 99.98, days, simulated: true }
}

/* ---------- Response time --------------------------------------------------- */

// REAL: round-trip time from *this visitor's browser* to /api/health (falls
// back to a static asset on hosts without API routes, e.g. GitHub Pages).
// It's genuine latency, just measured client-side rather than server-side.
const SAMPLE_INTERVAL_MS = 5000
const MAX_SAMPLES = 24

async function ping(): Promise<number | null> {
  for (const url of ['/api/health', '/favicon.ico']) {
    try {
      const start = performance.now()
      const res = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' })
      if (!res.ok) continue
      await res.arrayBuffer()
      return Math.round(performance.now() - start)
    } catch {
      /* try the next endpoint */
    }
  }
  return null
}

export function useResponseTimes() {
  const [samples, setSamples] = useState<number[]>([])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const tick = async () => {
      if (document.visibilityState === 'visible') {
        const ms = await ping()
        if (cancelled) return
        if (ms === null) setFailed(true)
        else {
          setFailed(false)
          setSamples((prev) => [...prev, ms].slice(-MAX_SAMPLES))
        }
      }
      timer = setTimeout(tick, SAMPLE_INTERVAL_MS)
    }
    tick()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  const avg = samples.length ? Math.round(samples.reduce((a, b) => a + b, 0) / samples.length) : null
  return { samples, avg, failed }
}

/* ---------- Last deploy ----------------------------------------------------- */

// REAL: stamped at build time in next.config.mjs. On Vercel/Netlify every
// deploy is a build, so this is the deploy time.
export const deploy = {
  time: process.env.NEXT_PUBLIC_BUILD_TIME ?? null,
  sha: process.env.NEXT_PUBLIC_COMMIT_SHA || null,
  env: process.env.NEXT_PUBLIC_DEPLOY_ENV || null,
}

// REAL: the Vercel region serving /api/health. Null off Vercel or on error.
export function useServingRegion() {
  const [region, setRegion] = useState<string | null>(null)
  useEffect(() => {
    fetch('/api/health', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setRegion(typeof d?.region === 'string' ? d.region : null))
      .catch(() => {})
  }, [])
  return region
}

/* ---------- Helpers --------------------------------------------------------- */

export function timeAgo(iso: string | null): string {
  if (!iso) return 'unknown'
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 48) return `${h}h ago`
  return `${Math.round(h / 24)}d ago`
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}
