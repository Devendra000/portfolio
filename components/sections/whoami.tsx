'use client'

export function Whoami() {
  return (
    <div className="space-y-2">
      {/* Prompt */}
      <div className="flex gap-2">
        <span style={{ color: 'var(--terminal-prompt)' }}>➜ ~/dev/portfolio</span>
        <span style={{ color: 'var(--terminal-muted)' }}>whoami</span>
      </div>

      {/* Output */}
      <div className="pl-0 space-y-1">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--terminal-name)' }}>
          Devendra Hamal
        </h1>
        <div style={{ color: 'var(--terminal-prompt)' }} className="text-sm">
          Full-Stack Developer · Kathmandu, Nepal
        </div>
      </div>
    </div>
  )
}
