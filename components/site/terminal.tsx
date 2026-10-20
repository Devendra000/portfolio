'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { commands } from '@/lib/terminal/commands'
import { Shell, type Line, type Tone } from '@/lib/terminal/shell'
import { caseStudies, sections } from '@/lib/site-config'
import { setTheme, toggleTheme } from './theme-toggle'

/* A sandboxed, in-browser terminal. Commands run against an in-memory
   filesystem (lib/terminal); nothing is sent over the network or evaluated. */

type Entry = { id: number; kind: 'out'; line: Line } | { id: number; kind: 'cmd'; user: string; path: string; text: string }

type NewEntry = Entry extends infer E ? (E extends Entry ? Omit<E, 'id'> : never) : never

const MAX_ENTRIES = 1500
const HISTORY_KEY = 'dhsh-history'
const BOOT_COMMAND = 'curl -I devendra.hamal'

const toneClass: Record<Tone, string> = {
  ink: 'text-ink',
  muted: 'text-ink-muted',
  accent: 'text-accent',
  info: 'text-info',
  warn: 'text-warn',
  danger: 'text-danger',
  bold: 'font-bold text-ink',
}

function Prompt({ user, path }: { user: string; path: string }) {
  return (
    <span className="shrink-0 whitespace-pre">
      <span className="text-accent">{user}</span>
      <span className="text-ink-muted">:</span>
      <span className="text-info">{path}</span>
      <span className="text-ink-muted">$ </span>
    </span>
  )
}

function OutputLine({ line }: { line: Line }) {
  if (typeof line === 'string') return <div className="min-h-[1.5em] whitespace-pre-wrap break-words text-ink-2">{line}</div>
  return (
    <div className="min-h-[1.5em] whitespace-pre-wrap break-words text-ink-2">
      {line.map((sp, i) =>
        sp.href ? (
          <a
            key={i}
            href={sp.href}
            target={sp.href.startsWith('/') || sp.href.startsWith('mailto:') ? undefined : '_blank'}
            rel="noopener noreferrer"
            className={`${sp.c ? toneClass[sp.c] : ''} underline decoration-dotted underline-offset-2 hover:decoration-solid`}
          >
            {sp.t}
          </a>
        ) : (
          <span key={i} className={sp.c ? toneClass[sp.c] : undefined}>
            {sp.t}
          </span>
        ),
      )}
    </div>
  )
}

export function Terminal() {
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>([])
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const [closed, setClosed] = useState(false)
  const [prompt, setPrompt] = useState({ user: 'devendra@portfolio', path: '~' })

  const rootRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const idRef = useRef(0)
  const pending = useRef<Entry[]>([])
  const flushScheduled = useRef(false)
  const histIdx = useRef<number | null>(null)
  const draft = useRef('')
  const maximizedRef = useRef(false)
  maximizedRef.current = maximized

  /* ---------- output buffering (one render per frame, even for `yes`) ---------- */

  const flush = useCallback(() => {
    flushScheduled.current = false
    const batch = pending.current
    pending.current = []
    if (batch.length) setEntries((prev) => [...prev, ...batch].slice(-MAX_ENTRIES))
  }, [])

  const push = useCallback(
    (e: NewEntry) => {
      pending.current.push({ ...e, id: idRef.current++ } as Entry)
      if (!flushScheduled.current) {
        flushScheduled.current = true
        requestAnimationFrame(flush)
      }
    },
    [flush],
  )
  const print = useCallback((line: Line) => push({ kind: 'out', line }), [push])

  /* ---------- the shell + page hooks ---------- */

  const shellRef = useRef<Shell | null>(null)
  if (!shellRef.current) {
    shellRef.current = new Shell(commands, {
      clear: () => {
        pending.current = []
        setEntries([])
      },
      setTheme: (t) => (t === 'toggle' ? toggleTheme() : setTheme(t)),
      maximize: (on = true) => setMaximized(on),
      close: () => (maximizedRef.current ? setMaximized(false) : setClosed(true)),
      navigate: (target) => {
        const t = target.toLowerCase()
        if (caseStudies.some((c) => c.slug === t)) {
          router.push(`/work/${t}`)
          return true
        }
        const alias: Record<string, string> = { home: 'top', projects: 'work', 'case-studies': 'work', status: 'system', dashboard: 'system' }
        const id = alias[t] ?? t
        if (!sections.some((s) => s.id === id)) return false
        setMaximized(false)
        requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }))
        return true
      },
    })
  }
  const sh = shellRef.current

  const run = useCallback(
    async (text: string, record = true) => {
      push({ kind: 'cmd', ...sh.prompt, text })
      histIdx.current = null
      draft.current = ''
      if (!text.trim()) return
      const ctrl = new AbortController()
      abortRef.current = ctrl
      setRunning(true)
      const before = sh.history.length
      await sh.execute(text, print, ctrl.signal)
      if (!record) sh.history.splice(before)
      abortRef.current = null
      setRunning(false)
      setPrompt(sh.prompt)
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(sh.history.slice(-100)))
      } catch {}
      requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }))
    },
    [print, push, sh],
  )

  // Boot sequence (guarded: StrictMode runs effects twice in dev).
  const booted = useRef(false)
  useEffect(() => {
    if (booted.current) return
    booted.current = true
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
      if (Array.isArray(saved)) sh.history = saved.filter((x) => typeof x === 'string').slice(-100)
    } catch {}
    print([{ t: 'DevendraOS 6.9.0-portfolio (tty1) — sandboxed shell, runs entirely in your browser', c: 'muted' }])
    print([
      { t: 'Type ', c: 'muted' },
      { t: 'help', c: 'accent' },
      { t: ' to see commands. Tab completes, ↑/↓ for history.', c: 'muted' },
    ])
    print('')
    run(BOOT_COMMAND, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ---------- scrolling, focus, fullscreen ---------- */

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries, running])

  useEffect(() => {
    if (!maximized) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    inputRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMaximized(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [maximized])

  // Lets the command palette open the terminal fullscreen.
  useEffect(() => {
    const onOpen = () => {
      setClosed(false)
      setMaximized(true)
    }
    window.addEventListener('terminal-maximize', onOpen)
    return () => window.removeEventListener('terminal-maximize', onOpen)
  }, [])

  const toggleNativeFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else if (rootRef.current?.requestFullscreen) await rootRef.current.requestFullscreen()
      else setMaximized((m) => !m)
    } catch {
      setMaximized((m) => !m)
    }
  }

  const focusInput = () => {
    if (window.getSelection()?.toString()) return // let people select & copy output
    inputRef.current?.focus({ preventScroll: true })
  }

  /* ---------- keyboard ---------- */

  const interrupt = () => {
    if (abortRef.current) {
      abortRef.current.abort()
    } else {
      push({ kind: 'cmd', ...sh.prompt, text: input + '^C' })
      setInput('')
      histIdx.current = null
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      if (inputRef.current && inputRef.current.selectionStart !== inputRef.current.selectionEnd) return // allow copy
      e.preventDefault()
      return interrupt()
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault()
      pending.current = []
      return setEntries([])
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'u') {
      e.preventDefault()
      return setInput('')
    }
    if (running) return
    if (e.key === 'Enter') {
      e.preventDefault()
      const text = input
      setInput('')
      run(text)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!sh.history.length) return
      if (histIdx.current === null) {
        draft.current = input
        histIdx.current = sh.history.length
      }
      histIdx.current = Math.max(0, histIdx.current - 1)
      setInput(sh.history[histIdx.current])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (histIdx.current === null) return
      histIdx.current++
      if (histIdx.current >= sh.history.length) {
        histIdx.current = null
        setInput(draft.current)
      } else setInput(sh.history[histIdx.current])
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const { value, options } = sh.complete(input)
      if (options.length > 1) {
        push({ kind: 'cmd', ...sh.prompt, text: input })
        print(options.join('  '))
      }
      setInput(value)
    }
  }

  /* ---------- render ---------- */

  const dot = 'size-3 rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2'

  return (
    <>
      {/* Keeps the hero layout stable while the terminal is maximized. */}
      {maximized && <div className="h-[340px] rounded-xl border border-dashed border-line sm:h-[400px]" aria-hidden />}
      <div
        ref={rootRef}
        className={`flex flex-col overflow-hidden border border-line bg-surface font-mono text-[13px] leading-normal shadow-xl shadow-black/10 ${
          maximized ? 'fixed inset-0 z-[60] rounded-none sm:inset-4 sm:rounded-xl' : 'relative h-[340px] rounded-xl sm:h-[400px]'
        } [&:fullscreen]:rounded-none`}
        role="region"
        aria-label="Interactive terminal"
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-line bg-surface-2 px-4 py-2.5">
          <button type="button" aria-label="Close terminal" title="Close" onClick={() => (setMaximized(false), setClosed(true))} className={`${dot} bg-[#ff5f57]`} />
          <button type="button" aria-label="Restore terminal size" title="Restore" onClick={() => setMaximized(false)} className={`${dot} bg-[#febc2e]`} />
          <button
            type="button"
            aria-label={maximized ? 'Restore terminal size' : 'Maximize terminal'}
            title={maximized ? 'Restore (Esc)' : 'Maximize'}
            onClick={() => (setClosed(false), setMaximized((m) => !m))}
            className={`${dot} bg-[#28c840]`}
          />
          <span className="ml-2 min-w-0 flex-1 truncate text-xs text-ink-muted">
            devendra@portfolio: {prompt.path} — dhsh
          </span>
          <button
            type="button"
            onClick={toggleNativeFullscreen}
            className="rounded p-1 text-ink-muted hover:bg-surface hover:text-ink"
            aria-label="Toggle browser fullscreen"
            title="Browser fullscreen"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>

        {closed ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-ink-muted">[process exited with code 0]</p>
            <button
              type="button"
              onClick={() => {
                setClosed(false)
                requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }))
              }}
              className="rounded-lg border border-line-strong px-4 py-2 text-ink hover:bg-surface-2"
            >
              Restart terminal
            </button>
          </div>
        ) : (
          <div ref={scrollRef} onClick={focusInput} className="flex-1 cursor-text overflow-y-auto overscroll-contain p-4 sm:p-5">
            <div role="log" aria-label="Terminal output">
              {entries.map((e) =>
                e.kind === 'cmd' ? (
                  <div key={e.id} className="flex min-h-[1.5em] whitespace-pre-wrap break-all">
                    <Prompt user={e.user} path={e.path} />
                    <span className="text-ink">{e.text}</span>
                  </div>
                ) : (
                  <OutputLine key={e.id} line={e.line} />
                ),
              )}
            </div>
            <div className={`flex items-center ${running ? 'h-0 overflow-hidden opacity-0' : ''}`}>
              <Prompt {...prompt} />
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  histIdx.current = null
                }}
                onKeyDown={onKeyDown}
                aria-label="Terminal command"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="send"
                className="min-w-0 flex-1 bg-transparent text-base text-ink caret-accent outline-none sm:text-[13px]"
              />
            </div>
            {running && (
              <button
                type="button"
                onClick={interrupt}
                className="mt-2 rounded border border-line px-2 py-0.5 text-xs text-ink-muted hover:text-ink"
              >
                running… press Ctrl+C or tap to stop
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
