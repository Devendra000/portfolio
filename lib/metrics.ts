'use client'

import { useEffect, useState } from 'react'
import { site } from '@/lib/site-config'

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
  for (const url of ['/api/health', '/icon.svg']) {
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
}

/* ---------- Latest GitHub commit -------------------------------------------- */

export type Commit = { message: string; repo: string; url: string; date: string; sha: string }
type CommitState =
  | { status: 'loading' }
  | { status: 'ok'; commit: Commit }
  | { status: 'error'; reason: 'rate-limited' | 'no-activity' | 'network' }

const CACHE_KEY = 'gh-latest-commit'
const CACHE_TTL_MS = 10 * 60 * 1000

// REAL: GitHub public API, unauthenticated (60 requests/hour per visitor IP).
// The events feed no longer includes commit messages, so we take the newest
// PushEvent's head SHA and look the commit up. Cached in sessionStorage for
// 10 minutes so navigating around doesn't burn the rate limit.
export function useLatestCommit(): CommitState {
  const [state, setState] = useState<CommitState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null')
      if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
        setState({ status: 'ok', commit: cached.commit })
        return
      }
    } catch {
      /* storage unavailable — just fetch */
    }

    ;(async () => {
      try {
        const evRes = await fetch(`https://api.github.com/users/${site.github}/events/public?per_page=30`)
        if (evRes.status === 403 || evRes.status === 429) throw new Error('rate-limited')
        if (!evRes.ok) throw new Error('network')
        const events: any[] = await evRes.json()
        const push = events.find((e) => e.type === 'PushEvent' && e.payload?.head)
        if (!push) throw new Error('no-activity')

        const cRes = await fetch(`https://api.github.com/repos/${push.repo.name}/commits/${push.payload.head}`)
        if (cRes.status === 403 || cRes.status === 429) throw new Error('rate-limited')
        if (!cRes.ok) throw new Error('network')
        const c = await cRes.json()

        const commit: Commit = {
          message: String(c.commit?.message ?? '').split('\n')[0],
          repo: push.repo.name,
          url: c.html_url,
          date: c.commit?.author?.date ?? push.created_at,
          sha: String(c.sha).slice(0, 7),
        }
        if (cancelled) return
        setState({ status: 'ok', commit })
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), commit }))
        } catch {}
      } catch (err) {
        if (cancelled) return
        const reason = (err as Error).message
        setState({
          status: 'error',
          reason: reason === 'rate-limited' || reason === 'no-activity' ? reason : 'network',
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return state
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
