import { NextResponse } from 'next/server'
import { site } from '@/lib/site-config'

// Contact form → email via Resend's REST API (plain fetch, no SDK).
// Env: RESEND_API_KEY (required), CONTACT_TO (defaults to site.email),
// MAIL_FROM (defaults to Resend's shared sender, which can only deliver to the
// address that owns the Resend account — verify a domain to send from your own).
export const dynamic = 'force-dynamic'

const TOPICS = ['Freelance project', 'Contract role', 'Full-time opportunity', 'Just saying hi']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const field = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Honeypot: real visitors never see this field, bots fill it. Pretend success.
  if (field(body.company, 200)) return NextResponse.json({ ok: true })

  const name = field(body.name, 100)
  const email = field(body.email, 200)
  const message = field(body.message, 5000)
  const topic = TOPICS.includes(field(body.topic, 50)) ? field(body.topic, 50) : TOPICS[0]

  if (!name || !message || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please fill in your name, a valid email and a message.' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[contact] RESEND_API_KEY is not set')
    return NextResponse.json({ error: 'Mail is not configured.' }, { status: 503 })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'Portfolio Contact <onboarding@resend.dev>',
      to: process.env.CONTACT_TO || site.email,
      reply_to: email,
      subject: `[${topic}] from ${name}`,
      text: `${message}\n\n— ${name} <${email}>\nTopic: ${topic}`,
      html: `<p style="white-space:pre-wrap">${escapeHtml(message)}</p><hr><p>— ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;<br>Topic: ${escapeHtml(topic)}</p>`,
    }),
  })

  if (!res.ok) {
    console.error(`[contact] Resend send failed (${res.status}): ${await res.text().catch(() => '')}`)
    return NextResponse.json({ error: 'Send failed.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
