'use client'

export function Skills() {
  const skills = [
    'PHP / Laravel',
    'Next.js / TypeScript',
    'NestJS',
    'AWS Bedrock',
  ]

  return (
    <div className="space-y-3 pt-4" style={{ borderTop: '1px solid var(--terminal-border)' }}>
      {/* Prompt */}
      <div className="flex gap-2">
        <span style={{ color: 'var(--terminal-prompt)' }}>➜ ~/dev/portfolio</span>
        <span style={{ color: 'var(--terminal-muted)' }}>cat skills.json</span>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        {skills.map((skill, i) => (
          <div
            key={i}
            className="px-4 py-3 rounded"
            style={{ backgroundColor: '#161b22', border: '1px solid var(--terminal-border)' }}
          >
            <div className="flex items-center gap-2">
              <span style={{ color: 'var(--terminal-prompt)' }}>▸</span>
              <span className="text-sm">{skill}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
