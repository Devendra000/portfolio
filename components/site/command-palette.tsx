'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { caseStudies, links, sections, site } from '@/lib/site-config'
import { SearchIcon } from './icons'
import { toggleTheme } from './theme-toggle'

type Command = { id: string; group: string; label: string; hint?: string; run: () => void }

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const listId = useId()

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setActive(0)
    restoreFocus.current?.focus?.()
  }, [])

  const goToSection = useCallback(
    (id: string) => {
      if (pathname === '/') {
        document.getElementById(id)?.scrollIntoView({ block: 'start' })
        history.replaceState(null, '', id === 'top' ? '/' : `#${id}`)
      } else {
        router.push(id === 'top' ? '/' : `/#${id}`)
      }
    },
    [pathname, router],
  )

  const commands = useMemo<Command[]>(
    () => [
      ...sections.map((s) => ({
        id: `s-${s.id}`,
        group: 'Navigate',
        label: s.label,
        hint: `#${s.id}`,
        run: () => goToSection(s.id),
      })),
      ...caseStudies.map((c) => ({
        id: `c-${c.slug}`,
        group: 'Case studies',
        label: c.name,
        hint: c.stack.slice(0, 2).join(' · '),
        run: () => router.push(`/work/${c.slug}`),
      })),
      {
        id: 'a-term',
        group: 'Actions',
        label: 'Open terminal (fullscreen)',
        hint: 'dhsh',
        run: () => {
          if (pathname === '/') window.dispatchEvent(new Event('terminal-maximize'))
          else router.push('/')
        },
      },
      { id: 'a-theme', group: 'Actions', label: 'Toggle light / dark mode', run: toggleTheme },
      {
        id: 'a-email',
        group: 'Actions',
        label: 'Copy email address',
        hint: site.email,
        run: async () => {
          try {
            await navigator.clipboard.writeText(site.email)
            setToast('Email copied to clipboard')
          } catch {
            window.location.href = links.email
          }
        },
      },
      { id: 'a-gh', group: 'Actions', label: 'Open GitHub', hint: `@${site.github}`, run: () => window.open(links.github, '_blank', 'noopener') },
      { id: 'a-li', group: 'Actions', label: 'Open LinkedIn', run: () => window.open(links.linkedin, '_blank', 'noopener') },
    ],
    [goToSection, router, pathname],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => `${c.group} ${c.label} ${c.hint ?? ''}`.toLowerCase().includes(q))
  }, [commands, query])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => {
          if (!o) restoreFocus.current = document.activeElement as HTMLElement
          return !o
        })
      }
    }
    const onOpen = () => {
      restoreFocus.current = document.activeElement as HTMLElement
      setOpen(true)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-command-palette', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-command-palette', onOpen)
    }
  }, [])

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  useEffect(() => setActive(0), [query])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const runCommand = (cmd: Command | undefined) => {
    if (!cmd) return
    close()
    cmd.run()
  }

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (filtered.length ? (i + 1) % filtered.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      runCommand(filtered[active])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'Tab') {
      // Only one focusable element inside the dialog — keep focus trapped.
      e.preventDefault()
    }
  }

  useEffect(() => {
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' })
  }, [active, listId])

  let lastGroup = ''

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]" onMouseDown={close}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="relative w-full max-w-lg overflow-hidden rounded-xl border border-line-strong bg-surface shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <SearchIcon className="shrink-0 text-ink-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Jump to a section, case study or action…"
                className="h-12 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={filtered[active] ? `${listId}-${active}` : undefined}
                aria-autocomplete="list"
              />
              <kbd className="rounded border border-line px-1.5 font-mono text-[11px] text-ink-muted">esc</kbd>
            </div>
            <ul id={listId} role="listbox" aria-label="Commands" className="max-h-[50vh] overflow-y-auto p-2">
              {filtered.length === 0 && <li className="px-3 py-6 text-center text-sm text-ink-muted">No matches. Try “contact”.</li>}
              {filtered.map((cmd, i) => {
                const header = cmd.group !== lastGroup ? cmd.group : null
                lastGroup = cmd.group
                return (
                  <li key={cmd.id} role="presentation">
                    {header && (
                      <div className="px-3 pb-1 pt-3 font-mono text-[11px] uppercase tracking-wider text-ink-muted" aria-hidden>
                        {header}
                      </div>
                    )}
                    <div
                      id={`${listId}-${i}`}
                      role="option"
                      aria-selected={i === active}
                      onMouseMove={() => setActive(i)}
                      onClick={() => runCommand(cmd)}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm ${
                        i === active ? 'bg-accent-soft text-ink' : 'text-ink-2'
                      }`}
                    >
                      <span>{cmd.label}</span>
                      {cmd.hint && <span className="truncate font-mono text-xs text-ink-muted">{cmd.hint}</span>}
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="flex gap-4 border-t border-line px-4 py-2 font-mono text-[11px] text-ink-muted">
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span className="ml-auto">⌘K / Ctrl K</span>
            </div>
          </div>
        </div>
      )}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
        {toast && (
          <div className="rounded-md border border-line bg-surface px-4 py-2 font-mono text-xs text-ink shadow-lg">{toast}</div>
        )}
      </div>
    </>
  )
}
