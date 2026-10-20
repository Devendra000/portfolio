import { NextResponse } from 'next/server'

// Tiny endpoint the dashboard pings to measure real round-trip latency.
export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json(
    { status: 'ok', time: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
