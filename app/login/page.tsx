import type { Metadata } from 'next'
import { LoginForm } from './login-form'

export const metadata: Metadata = { title: 'Login', robots: { index: false, follow: false } }

export default function LoginPage() {
  return (
    <main id="main" className="bg-grid grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-6">
        <p className="font-mono text-xs text-ink-muted">~/tracker</p>
        <h1 className="mt-1 text-xl font-semibold text-ink">Owner login</h1>
        <LoginForm />
      </div>
    </main>
  )
}
