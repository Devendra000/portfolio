'use client'

import { useState, useEffect } from 'react'
import { TerminalWindow } from '@/components/terminal-window'
import { Whoami } from '@/components/sections/whoami'
import { Skills } from '@/components/sections/skills'
import { Projects } from '@/components/sections/projects'
import { Contact } from '@/components/sections/contact'
import { LeftPanel } from '@/components/layout/left-panel'
import { RightPanel } from '@/components/layout/right-panel'

export default function Home() {
  const [activeSection, setActiveSection] = useState('about')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const savedSection = localStorage.getItem('activeSection')
    if (savedSection) {
      setActiveSection(savedSection)
    }
  }, [])

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    localStorage.setItem('activeSection', section)
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'about':
        return <Whoami />
      case 'skills':
        return <Skills />
      case 'projects':
        return <Projects />
      case 'contact':
        return <Contact />
      default:
        return <Whoami />
    }
  }

  if (!isMounted) return null

  return (
    <main className="min-h-screen w-full flex gap-0" style={{ backgroundColor: 'var(--terminal-bg)' }}>
      {/* Left Panel */}
      <div className="w-48 border-r" style={{ borderColor: 'var(--terminal-border)' }}>
        <LeftPanel activeSection={activeSection} onSectionChange={handleSectionChange} />
      </div>

      {/* Center Terminal */}
      <div className="flex-1 flex p-4 md:p-8 border-r" style={{ borderColor: 'var(--terminal-border)' }}>
        <TerminalWindow>
          {renderContent()}
        </TerminalWindow>
      </div>

      {/* Right Panel */}
      <div className="w-48 hidden lg:block">
        <RightPanel />
      </div>
    </main>
  )
}
