// Usage: node scripts/hash-password.mjs 'your-password'
// Prints a value for ADMIN_PASSWORD_HASH (same format lib/auth/password.ts verifies).
import { randomBytes, scryptSync } from 'node:crypto'

const password = process.argv[2]
if (!password) {
  console.error('Pass the password as the first argument.')
  process.exit(1)
}
if (password.length < 12) console.error('Warning: passwords under 12 characters are easy to guess.')
const salt = randomBytes(16)
const hash = scryptSync(password, salt, 64)
console.log(`scrypt:${salt.toString('hex')}:${hash.toString('hex')}`)
