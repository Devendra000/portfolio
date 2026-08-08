'use client'

import { useState } from 'react'

export function Projects() {
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [showContent, setShowContent] = useState(false)

  const projects = [
    // {
    //   name: 'TalentCapture',
    //   description: 'AI-powered recruitment platform',
    //   fullDescription: 'An intelligent recruitment platform leveraging AI to screen candidates, analyze resumes, and match them with job opportunities.',
    //   stack: ['PHP', 'Laravel', 'AWS Bedrock', 'PostgreSQL', 'React'],
    //   role: 'Full-stack development • AI integration • Database architecture',
    //   link: 'https://github.com/devendrahamal',
    // },
    {
      name: 'PrepMate',
      description: 'LMS with Prisma + Next.js',
      fullDescription: 'A comprehensive Learning Management System for course creation, student management, and progress tracking.',
      stack: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL', 'Tailwind CSS'],
      role: 'Full-stack development • Database modeling • API design',
      link: 'https://www.prepmate.tech',
    },
    {
      name: 'ChatMandu',
      description: 'WhatsApp Business API',
      fullDescription: 'A platform integrating WhatsApp messaging for automated customer support and business communication.',
      stack: ['NestJS', 'TypeScript', 'WhatsApp API', 'Redis', 'PostgreSQL'],
      role: 'Backend development • API integration • Message queue architecture',
      link: 'https://www.chatmandu.tech',
    },
    // {
    //   name: 'EduFlow',
    //   description: 'Educational content management',
    //   fullDescription: 'Educational platform for managing and delivering online courses with interactive content.',
    //   stack: ['Laravel', 'React', 'PostgreSQL', 'Redis', 'AWS'],
    //   role: 'Full-stack development • Content delivery • Performance optimization',
    //   link: 'https://github.com/devendrahamal',
    // },
  ]

  const handleProjectClick = (projectName: string) => {
    if (expandedProject === projectName) {
      setExpandedProject(null)
      setShowContent(false)
    } else {
      setExpandedProject(projectName)
      requestAnimationFrame(() => setShowContent(true))
    }
  }

  return (
    <div className="space-y-3 pt-4" style={{ borderTop: '1px solid var(--terminal-border)' }}>
      {/* Prompt */}
      <div className="flex gap-2">
        <span style={{ color: 'var(--terminal-prompt)' }}>➜ ~/dev/portfolio</span>
        <span style={{ color: 'var(--terminal-muted)' }}>ls -la ./projects</span>
      </div>

      {/* Projects List - Full Width */}
      <div className="space-y-2 pt-2">
        {projects.map((project, i) => (
          <div key={i} className="flex flex-col gap-2">
            <button
              onClick={() => handleProjectClick(project.name)}
              className="w-full px-4 py-3 rounded text-left hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#161b22', border: '1px solid var(--terminal-border)' }}
            >
              <div className="flex items-start gap-2">
                <span style={{ color: 'var(--terminal-prompt)' }}>▸</span>
                <div className="flex-1">
                  <div style={{ color: 'var(--terminal-highlight)' }} className="font-medium text-sm">
                    {project.name}
                  </div>
                  <div style={{ color: 'var(--terminal-muted)' }} className="text-xs mt-1">
                    {project.description}
                  </div>
                </div>
              </div>
            </button>

            {/* Expanded Details */}
            {expandedProject === project.name && (
              <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: showContent ? '400px' : '0px' }}
              >
                <div className="px-4 py-3 rounded space-y-2" style={{ backgroundColor: '#0d1117', border: '1px solid var(--terminal-border)' }}>
                  <div className="flex gap-2">
                    <span style={{ color: 'var(--terminal-prompt)' }}>❯</span>
                    <span style={{ color: 'var(--terminal-text)' }}>cat {project.name}.md</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div style={{ color: 'var(--terminal-muted)' }}>
                      {project.fullDescription}
                    </div>

                    <div>
                      <div style={{ color: 'var(--terminal-prompt)' }} className="font-medium">
                        Stack:
                      </div>
                      <div style={{ color: 'var(--terminal-highlight)' }} className="mt-1">
                        {project.stack.join(' · ')}
                      </div>
                    </div>

                    <div>
                      <div style={{ color: 'var(--terminal-prompt)' }} className="font-medium">
                        Role:
                      </div>
                      <div style={{ color: 'var(--terminal-muted)' }} className="mt-1">
                        {project.role}
                      </div>
                    </div>

                    <div>
                      <div style={{ color: 'var(--terminal-prompt)' }} className="font-medium">
                        Link:
                      </div>
                      <div className="mt-1">
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-1 w-fit"
                          style={{ color: 'var(--terminal-highlight)' }}
                        >
                          View Project
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
