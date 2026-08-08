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
    <div className="md:h-screen py-4 md:py-6 px-4 flex flex-col md:flex-col gap-4 md:gap-8 overflow-x-auto" style={{ backgroundColor: '#0d1117' }}>
      {/* Header */}
      <div className="hidden md:block">
        <div style={{ color: 'var(--terminal-name)' }} className="text-sm font-bold">
          MENU
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-row md:flex-col gap-2 md:gap-0 md:space-y-3 flex-1 overflow-x-auto scrollbar-hide">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`whitespace-nowrap text-left px-3 py-2 rounded transition-colors text-sm shrink-0 md:border-l-2 border-b-2 md:border-b-0`}
            style={{
              color: activeSection === item.id ? 'var(--terminal-highlight)' : 'var(--terminal-muted)',
              backgroundColor: activeSection === item.id ? '#161b22' : 'transparent',
              borderColor: activeSection === item.id ? 'var(--terminal-highlight)' : 'transparent',
            }}
          >
            <span style={{ color: 'var(--terminal-prompt)' }} className="hidden md:inline-block">•</span>
            <span className="md:ml-2">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ color: 'var(--terminal-muted)' }} className="text-xs opacity-60 hidden md:block">
        v1.0.0
      </div>
    </div>
  )
}
