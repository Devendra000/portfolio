import { jwtVerify, SignJWT } from 'jose'

// Stateless session: a signed JWT in an httpOnly cookie. There is exactly one
// user (the site owner), so the token only needs to prove "owner logged in".
// Env: SESSION_SECRET — at least 32 random chars (`openssl rand -base64 32`).

export const SESSION_COOKIE = 'tracker_session'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

export type SessionPayload = { sub: 'owner'; exp?: number }

function secretKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET must be set (32+ chars)')
  return new TextEncoder().encode(secret)
}

export async function signSession(): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('owner')
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey())
}

export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] })
    return payload.sub === 'owner' ? { sub: 'owner', exp: payload.exp } : null
  } catch {
    return null
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
}
