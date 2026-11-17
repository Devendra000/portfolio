import { cookies } from 'next/headers'
import { verifyPassword } from '@/lib/auth/password'
import { SESSION_COOKIE, sessionCookieOptions, signSession } from '@/lib/auth/session'
import { clearLoginFailures, loginFailures, MAX_LOGIN_FAILURES, recordLoginFailure } from '@/lib/tracker/db'

export const dynamic = 'force-dynamic'

// POST { password } → sets the session cookie. Single owner account; the
// password hash lives in ADMIN_PASSWORD_HASH (see scripts/hash-password.mjs).
export async function POST(req: Request) {
  try {
    return await login(req)
  } catch (err) {
    // Usually DynamoDB: missing/invalid AWS keys, wrong region, or table not created.
    // Fails closed — no login without the rate limiter.
    console.error('[auth] login failed:', err)
    const detail = process.env.NODE_ENV === 'production' ? '' : ` (${(err as Error).name}: ${(err as Error).message})`
    return Response.json({ error: `Database unavailable${detail}` }, { status: 503 })
  }
}

async function login(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'

  if ((await loginFailures(ip)) >= MAX_LOGIN_FAILURES) {
    return Response.json({ error: 'Too many failed attempts. Try again in 15 minutes.' }, { status: 429 })
  }

  let password = ''
  try {
    const body = await req.json()
    password = typeof body?.password === 'string' ? body.password.slice(0, 200) : ''
  } catch {
    return Response.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!process.env.ADMIN_PASSWORD_HASH) {
    console.error('[auth] ADMIN_PASSWORD_HASH is not set')
    return Response.json({ error: 'Login is not configured.' }, { status: 503 })
  }

  if (!(await verifyPassword(password, process.env.ADMIN_PASSWORD_HASH))) {
    await recordLoginFailure(ip)
    return Response.json({ error: 'Wrong password.' }, { status: 401 })
  }

  await clearLoginFailures(ip)
  ;(await cookies()).set(SESSION_COOKIE, await signSession(), sessionCookieOptions)
  return Response.json({ ok: true })
}
