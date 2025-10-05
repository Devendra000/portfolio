"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"

const technologies = [
  { name: "Laravel", icon: "🔷" },
  { name: "JavaScript", icon: "⚡" },
  { name: "Python", icon: "🐍" },
  { name: "React", icon: "⚛️" },
  { name: "Node.js", icon: "🟢" },
  { name: "Vue.js", icon: "💚" },
  { name: "MySQL", icon: "🗄️" },
  { name: "PostgreSQL", icon: "🐘" },
  { name: "Redis", icon: "🔴" },
  { name: "Docker", icon: "🐳" },
  { name: "Git", icon: "📦" },
  { name: "AWS", icon: "☁️" },
]

export default function TechStackSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="tech-stack" className="relative py-32 px-4" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center glow-text font-mono">Tech Stack</h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-16 glow-border" />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {technologies.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="relative group"
              >
                <div className="bg-card/50 backdrop-blur-sm border border-primary/20 rounded-lg p-6 text-center hover:border-primary/50 transition-all duration-300 glow-border">
                  <motion.div
                    className="text-5xl mb-3"
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: index * 0.1,
                    }}
                  >
                    {tech.icon}
                  </motion.div>
                  <p className="text-foreground font-mono font-semibold">{tech.name}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
