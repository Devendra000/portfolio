"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Card } from "@/components/ui/card"

const skills = [
  { name: "Laravel", level: 95 },
  { name: "JavaScript", level: 90 },
  { name: "Python", level: 85 },
  { name: "React", level: 88 },
  { name: "Node.js", level: 82 },
  { name: "MySQL", level: 87 },
]

export default function AboutSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="about" className="relative py-32 px-4" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center glow-text font-mono">About Me</h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-16 glow-border" />

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/20 glow-border">
                <p className="text-lg leading-relaxed text-muted-foreground mb-6">
                  I'm a passionate software developer with expertise in building robust, scalable web applications. With
                  years of experience in Laravel, JavaScript, and Python, I specialize in creating elegant solutions to
                  complex problems.
                </p>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  My approach combines clean code principles with modern development practices, ensuring every project
                  is maintainable, performant, and user-friendly.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-6"
            >
              {skills.map((skill, index) => (
                <div key={skill.name}>
                  <div className="flex justify-between mb-2">
                    <span className="text-foreground font-mono font-semibold">{skill.name}</span>
                    <span className="text-primary font-mono">{skill.level}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-secondary glow-border"
                      initial={{ width: 0 }}
                      animate={isInView ? { width: `${skill.level}%` } : {}}
                      transition={{ duration: 1, delay: 0.6 + index * 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
