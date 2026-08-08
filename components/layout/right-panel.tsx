'use client'

export function RightPanel() {
  const rightItems = [
    {
      label: 'Spotify',
      icon: '♪',
      status: 'Not Playing',
    },
    {
      label: 'GitHub',
      icon: '🔗',
      status: 'devendrahamal',
    },
    {
      label: 'LinkedIn',
      icon: '💼',
      status: '@devendrahamal',
    },
    {
      label: 'Twitter',
      icon: '𝕏',
      status: '@devenhamal',
    },
  ]

  return (
    <div className="h-screen p-6 flex flex-col gap-8 overflow-y-auto" style={{ backgroundColor: '#0d1117' }}>
      {/* Header */}
      <div>
        <div style={{ color: 'var(--terminal-name)' }} className="text-sm font-bold">
          STATUS
        </div>
      </div>

      {/* Status Items */}
      <div className="space-y-4 flex-1">
        {rightItems.map((item, i) => (
          <div
            key={i}
            className="px-4 py-3 rounded"
            style={{ backgroundColor: '#161b22', border: '1px solid var(--terminal-border)' }}
          >
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--terminal-highlight)' }}>{item.icon}</span>
              <div className="flex-1">
                <div style={{ color: 'var(--terminal-highlight)' }} className="text-xs font-medium">
                  {item.label}
                </div>
                <div style={{ color: 'var(--terminal-muted)' }} className="text-xs mt-1">
                  {item.status}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="space-y-2 text-xs" style={{ color: 'var(--terminal-muted)' }}>
        <div className="flex justify-between">
          <span>Uptime:</span>
          <span>247d</span>
        </div>
        <div className="flex justify-between">
          <span>Projects:</span>
          <span>12</span>
        </div>
        <div className="flex justify-between">
          <span>Commits:</span>
          <span>1.2k</span>
        </div>
      </div>
    </div>
  )
}
