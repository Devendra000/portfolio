'use client'

export function Contact() {
  const contacts = [
    {
      label: 'Email',
      value: 'devendra@example.com',
      link: 'mailto:devendra@example.com',
    },
    {
      label: 'GitHub',
      value: 'github.com/devendrahamal',
      link: 'https://github.com/devendrahamal',
    },
    {
      label: 'LinkedIn',
      value: 'linkedin.com/in/devendrahamal',
      link: 'https://linkedin.com/in/devendrahamal',
    },
  ]

  return (
    <div className="space-y-3 pt-4" style={{ borderTop: '1px solid var(--terminal-border)' }}>
      {/* Prompt */}
      <div className="flex gap-2">
        <span style={{ color: 'var(--terminal-prompt)' }}>➜ ~/dev/portfolio</span>
        <span style={{ color: 'var(--terminal-muted)' }}>cat contact.sh</span>
      </div>

      {/* Contact Output - Full Width */}
      <div className="space-y-2 pt-2">
        {contacts.map((contact, i) => (
          <a
            key={i}
            href={contact.link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-4 py-3 rounded hover:opacity-80 transition-opacity block"
            style={{ backgroundColor: '#161b22', border: '1px solid var(--terminal-border)' }}
          >
            <div className="flex items-start gap-2">
              <span style={{ color: 'var(--terminal-prompt)' }}>▸</span>
              <div className="flex-1">
                <div style={{ color: 'var(--terminal-highlight)' }} className="font-medium text-sm">
                  {contact.label}
                </div>
                <div style={{ color: 'var(--terminal-muted)' }} className="text-xs mt-1">
                  {contact.value}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
