import 'server-only'
import { scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>

// Hash format: scrypt:<salt hex>:<hash hex> (":" not "$" — .env files expand $). Generate one with:
//   node scripts/hash-password.mjs 'your-password'
// and put it in ADMIN_PASSWORD_HASH. The plaintext password is never stored.
export async function verifyPassword(password: string, stored: string | undefined): Promise<boolean> {
  if (!stored) return false
  const [algo, saltHex, hashHex] = stored.split(':')
  if (algo !== 'scrypt' || !saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, 'hex')
  const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
