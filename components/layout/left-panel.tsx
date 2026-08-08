'use client'

interface LeftPanelProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function LeftPanel({ activeSection, onSectionChange }: LeftPanelProps) {
  const menuItems = [
    { id: 'about', label: 'About Me' },
    { id: 'skills', label: 'Skills' },
    { id: 'projects', label: 'Projects' },
    { id: 'contact', label: 'Contact' },
  ]

  return (
    <div className="h-screen p-6 flex flex-col gap-8" style={{ backgroundColor: '#0d1117' }}>
      {/* Header */}
      <div>
        <div style={{ color: 'var(--terminal-name)' }} className="text-sm font-bold">
          MENU
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-3 flex-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className="w-full text-left px-3 py-2 rounded transition-colors text-sm"
            style={{
              color: activeSection === item.id ? 'var(--terminal-highlight)' : 'var(--terminal-muted)',
              backgroundColor: activeSection === item.id ? '#161b22' : 'transparent',
              borderLeft: activeSection === item.id ? '2px solid var(--terminal-highlight)' : '2px solid transparent',
              paddingLeft: 'calc(12px - 2px)',
            }}
          >
            <span style={{ color: 'var(--terminal-prompt)' }}>•</span>
            <span className="ml-2">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ color: 'var(--terminal-muted)' }} className="text-xs opacity-60">
        v1.0.0
      </div>
    </div>
  )
}
