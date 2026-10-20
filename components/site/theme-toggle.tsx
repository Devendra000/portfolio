'use client'

import { useEffect, useState } from 'react'
import { MoonIcon, SunIcon } from './icons'

export type Theme = 'dark' | 'light'

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem('theme', theme)
  } catch {}
  window.dispatchEvent(new CustomEvent('themechange', { detail: theme }))
}

export function toggleTheme() {
  setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light')
}

export function ThemeToggle() {
  const [theme, setLocal] = useState<Theme>('dark')

  useEffect(() => {
    setLocal(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')
    const onChange = (e: Event) => setLocal((e as CustomEvent<Theme>).detail)
    window.addEventListener('themechange', onChange)
    return () => window.removeEventListener('themechange', onChange)
  }, [])

  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="inline-flex size-9 items-center justify-center rounded-md border border-line text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
