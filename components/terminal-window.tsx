'use client'

import React from 'react'

export function TerminalWindow({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full max-w-5xl mx-auto">
      {/* Terminal Window Container */}
      <div 
        className="rounded-lg overflow-hidden shadow-2xl h-full flex flex-col"
        style={{ backgroundColor: 'var(--terminal-bg)', border: '1px solid var(--terminal-border)' }}
      >
        {/* Title Bar */}
        <div 
          className="px-4 py-3 flex items-center gap-3"
          style={{ backgroundColor: '#1c2128', borderBottom: '1px solid var(--terminal-border)' }}
        >
          {/* Traffic Light Dots */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--terminal-light-red)' }} />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--terminal-yellow)' }} />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--terminal-green)' }} />
          </div>
          
          {/* Title */}
          <div 
            className="text-xs font-medium ml-2 flex-1 text-center"
            style={{ color: 'var(--terminal-muted)' }}
          >
            ~/dev/portfolio — bash
          </div>
        </div>

        {/* Terminal Body */}
        <div 
          className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto"
          style={{ color: 'var(--terminal-text)' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
