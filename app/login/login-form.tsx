'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError('')
    const password = new FormData(e.currentTarget).get('password')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }).catch(() => null)
    if (res?.ok) {
      router.replace('/tracker')
      router.refresh()
      return
    }
    setError((await res?.json().catch(() => null))?.error ?? 'Something went wrong.')
    setPending(false)
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-3">
      <label className="block text-sm text-ink-2" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-ink outline-none focus:border-accent"
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-ink disabled:opacity-60"
      >
        {pending ? 'Checking…' : 'Log in'}
      </button>
    </form>
  )
}
