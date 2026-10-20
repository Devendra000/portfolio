import { links, site } from '@/lib/site-config'

export function Footer() {
  const sha = process.env.NEXT_PUBLIC_COMMIT_SHA
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 font-mono text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2">
          <span className="status-dot" aria-hidden /> operational
          {sha && <span>· build {sha}</span>}
        </p>
        <p>
          © {new Date().getFullYear()} {site.name} ·{' '}
          <a href={links.github} className="hover:text-ink" target="_blank" rel="noopener noreferrer">
            github
          </a>{' '}
          ·{' '}
          <a href={links.linkedin} className="hover:text-ink" target="_blank" rel="noopener noreferrer">
            linkedin
          </a>
        </p>
      </div>
    </footer>
  )
}
