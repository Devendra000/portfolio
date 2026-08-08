'use client'

import { useState, useEffect } from 'react'

export function RightPanel() {
  const [listenStatus, setListenStatus] = useState('Not Playing')

  useEffect(() => {
    const handleMusicStatus = (e: any) => {
      const { isPlaying, currentSong } = e.detail
      if (isPlaying && currentSong) {
        setListenStatus(currentSong)
      } else {
        setListenStatus('Paused')
      }
    }

    window.addEventListener('music-status', handleMusicStatus)
    return () => window.removeEventListener('music-status', handleMusicStatus)
  }, [])

  const rightItems = [
    {
      label: 'Listen',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>,
      status: listenStatus,
    },
    {
      label: 'GitHub',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>,
      status: 'devendra000',
    },
    {
      label: 'LinkedIn',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>,
      status: '@devendra-hamal',
    },
    {
      label: 'Mail',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>,
      status: 'devendra.hamal058@gmail.com',
    },
  ]

  return (
    <div className="md:h-screen h-auto py-6 px-4 flex flex-col gap-6 md:gap-8 overflow-y-auto" style={{ backgroundColor: '#0d1117' }}>
      {/* Header */}
      <div>
        <div style={{ color: 'var(--terminal-name)' }} className="text-sm font-bold">
          CONTACT ME
        </div>
      </div>

      {/* Status Items */}
      <div className="grid grid-cols-2 md:flex md:flex-col gap-4 flex-1">
        {rightItems.map((item, i) => (
          <div
            key={i}
            className="px-4 py-3 rounded"
            style={{ backgroundColor: '#161b22', border: '1px solid var(--terminal-border)' }}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-2">
              <span style={{ color: 'var(--terminal-highlight)' }}>{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div style={{ color: 'var(--terminal-highlight)' }} className="text-xs font-medium truncate">
                  {item.label}
                </div>
                <div style={{ color: 'var(--terminal-muted)' }} className="text-xs mt-1 truncate">
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
