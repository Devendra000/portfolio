'use client'

import { useState } from 'react'
import { links, site } from '@/lib/site-config'
import { GitHubIcon, LinkedInIcon, MailIcon } from './icons'
import { SectionHeading } from './section-heading'

// Set NEXT_PUBLIC_FORMSPREE_ID (free at formspree.io) to receive submissions by
// email. Without it, the form falls back to opening the visitor's mail client.
const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID

type Status = { kind: 'idle' | 'sending' | 'sent' | 'error'; message?: string }

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-accent focus:outline-none'

export function Contact() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>

    if (!FORMSPREE_ID) {
      const body = `${data.message}\n\n— ${data.name} (${data.email})`
      window.location.href = `${links.email}?subject=${encodeURIComponent(`[${data.topic}] from ${data.name}`)}&body=${encodeURIComponent(body)}`
      setStatus({ kind: 'sent', message: 'Opening your email app… if nothing happens, email me directly below.' })
      return
    }

    setStatus({ kind: 'sending' })
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      form.reset()
      setStatus({ kind: 'sent', message: 'Message received. I usually reply within one business day.' })
    } catch {
      setStatus({ kind: 'error', message: `That didn’t go through. Please email me at ${site.email}.` })
    }
  }

  const direct = [
    { label: 'Email', value: site.email, href: links.email, icon: MailIcon },
    { label: 'LinkedIn', value: `in/${site.linkedin}`, href: links.linkedin, icon: LinkedInIcon },
    { label: 'GitHub', value: `@${site.github}`, href: links.github, icon: GitHubIcon },
  ]

  return (
    <section id="contact" aria-labelledby="contact-title" className="scroll-mt-20">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <SectionHeading id="contact-title" eyebrow="05 · contact" title="Open a ticket.">
            Tell me what you’re building and where it hurts. I’ll reply with honest next steps — even if that’s “you
            don’t need me yet”.
          </SectionHeading>
          <ul className="space-y-2">
            {direct.map(({ label, value, href, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target={href.startsWith('mailto') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 transition-colors hover:border-line-strong"
                >
                  <Icon className="text-accent" />
                  <span className="text-sm font-medium text-ink">{label}</span>
                  <span className="ml-auto truncate font-mono text-xs text-ink-muted">{value}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={onSubmit} className="rounded-xl border border-line bg-surface p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-ink-2">
              Name
              <input name="name" required autoComplete="name" className={fieldClass} placeholder="Ada Lovelace" />
            </label>
            <label className="block text-sm font-medium text-ink-2">
              Email
              <input name="email" type="email" required autoComplete="email" className={fieldClass} placeholder="ada@company.com" />
            </label>
          </div>
          <label className="mt-4 block text-sm font-medium text-ink-2">
            What’s this about?
            <select name="topic" className={fieldClass} defaultValue="Freelance project">
              <option>Freelance project</option>
              <option>Contract role</option>
              <option>Full-time opportunity</option>
              <option>Just saying hi</option>
            </select>
          </label>
          <label className="mt-4 block text-sm font-medium text-ink-2">
            Message
            <textarea
              name="message"
              required
              rows={5}
              className={fieldClass}
              placeholder="What are you building, what’s the timeline, and what does success look like?"
            />
          </label>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={status.kind === 'sending'}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {status.kind === 'sending' ? 'Sending…' : 'Send message'}
            </button>
            <p
              role="status"
              aria-live="polite"
              className={`text-sm ${status.kind === 'error' ? 'text-danger' : status.kind === 'sent' ? 'text-accent' : 'text-ink-muted'}`}
            >
              {status.message ?? 'Typical response time: < 24h'}
            </p>
          </div>
        </form>
      </div>
    </section>
  )
}
