'use client'

import Link from 'next/link'
import { sections } from '@/lib/site-config'
import { SearchIcon } from './icons'
import { ThemeToggle } from './theme-toggle'

export function openCommandPalette() {
  window.dispatchEvent(new Event('open-command-palette'))
}

export function Header() {
  const nav = sections.filter((s) => ['system', 'work', 'about', 'contact'].includes(s.id))
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-mono text-sm font-medium text-ink">
          <span className="status-dot" aria-hidden />
          <span>
            devendra<span className="text-ink-muted">.hamal</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1">
            {nav.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/#${s.id}`}
                  className="rounded-md px-3 py-2 text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-2">
          <button
            type="button"
            onClick={openCommandPalette}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-line px-3 text-sm text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="Open command palette"
            aria-keyshortcuts="Control+K Meta+K"
          >
            <SearchIcon />
            <span className="md:hidden">Menu</span>
            <kbd className="hidden rounded border border-line bg-surface-2 px-1.5 font-mono text-[11px] text-ink-muted md:inline">
              ⌘K
            </kbd>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
