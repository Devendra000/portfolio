import { NextResponse } from 'next/server'

// Tiny endpoint the dashboard pings to measure real round-trip latency.
export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json(
    // VERCEL_REGION is only set at runtime, so the dashboard reads it from here.
    { status: 'ok', time: new Date().toISOString(), region: process.env.VERCEL_REGION ?? null },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
