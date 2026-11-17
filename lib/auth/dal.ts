import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SESSION_COOKIE, verifySessionToken } from './session'

// The real authorization check. proxy.ts only does an optimistic redirect —
// every page, server action and API route that touches data calls one of these.

export async function getSession() {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value)
}

/** For pages / server actions: redirects to /login when logged out. */
export async function requireSession() {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}

/** For route handlers: returns a 401 Response when logged out, else null. */
export async function unauthorized(): Promise<Response | null> {
  return (await getSession()) ? null : Response.json({ error: 'Unauthorized' }, { status: 401 })
}
