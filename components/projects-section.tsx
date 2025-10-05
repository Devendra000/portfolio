"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Github } from "lucide-react"
import { getAssetUrl } from "@/lib/utils"

const projects = [
  {
    title: "Full-Stack E-Commerce App",
    description:
      "Modern e-commerce platform built with React, Node.js, and MongoDB. Features include user authentication, payment processing, real-time inventory, and admin dashboard.",
    tech: ["React", "Node.js", "MongoDB", "Stripe"],
    image: "modern-ecommerce-dashboard.png",
    github: "https://github.com/devendra000",
    demo: "https://demo.com",
  },
  {
    title: "Real-Time Chat Application",
    description:
      "WebSocket-based chat application with React frontend and Node.js backend. Includes features like rooms, private messaging, file sharing, and user presence indicators.",
    tech: ["React", "Socket.io", "Node.js", "Redis"],
    image: "ai-content-generator-interface.png",
    github: "https://github.com/devendra000",
    demo: "https://demo.com",
  },
  {
    title: "Data Visualization Dashboard",
    description:
      "Interactive analytics dashboard for business metrics visualization. Built with React, D3.js, and Python backend for data processing and API services.",
    tech: ["React", "D3.js", "Python", "FastAPI"],
    image: "analytics-dashboard-dark-theme.png",
    github: "https://github.com/devendra000",
    demo: "https://demo.com",
  },
  {
    title: "Task Management Platform",
    description:
      "Collaborative project management tool with Kanban boards, team collaboration, real-time updates, and progress tracking. Built with modern web technologies.",
    tech: ["React", "TypeScript", "Node.js", "PostgreSQL"],
    image: "task-management-kanban.png",
    github: "https://github.com/devendra000",
    demo: "https://demo.com",
  },
]

export default function ProjectsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section id="projects" className="relative py-32 px-4" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center glow-text font-mono">Featured Projects</h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-16 glow-border" />

          <div className="grid md:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                onHoverStart={() => setHoveredIndex(index)}
                onHoverEnd={() => setHoveredIndex(null)}
              >
                <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-all duration-300 h-full">
                  <div className="relative overflow-hidden group">
                    <img
                      src={project.image ? getAssetUrl(project.image) : getAssetUrl("placeholder.svg")}
                      alt={project.title}
                      className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: hoveredIndex === index ? 0.9 : 0.5 }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  <div className="p-6">
                    <h3 className="text-2xl font-bold mb-3 text-foreground font-mono">{project.title}</h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">{project.description}</p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {project.tech.map((tech, techIndex) => (
                        <span
                          key={tech}
                          className="px-3 py-1 text-sm bg-primary/10 text-primary border border-primary/30 rounded-full font-mono transition-all hover:scale-105 hover:bg-primary/15"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-primary/50 text-primary hover:bg-primary/10 bg-transparent transition-all hover:scale-105"
                        asChild
                      >
                        <a href={project.github} target="_blank" rel="noopener noreferrer">
                          <Github className="w-4 h-4 mr-2" />
                          Code
                        </a>
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105" 
                        asChild
                      >
                        <a href={project.demo} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Live Demo
                        </a>
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
