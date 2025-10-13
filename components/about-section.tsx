"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Card } from "@/components/ui/card"

const skills = [
  { name: "JavaScript", level: 95, color: "from-primary/60 to-primary" },
  { name: "React", level: 92, color: "from-primary/60 to-primary" },
  { name: "Node.js", level: 88, color: "from-primary/60 to-primary" },
  { name: "TypeScript", level: 85, color: "from-primary/60 to-primary" },
  { name: "Python", level: 82, color: "from-primary/60 to-primary" },
  { name: "MongoDB", level: 87, color: "from-primary/60 to-primary" },
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
                  I'm Devendra Hamal, a leading <strong>software developer in Nepal</strong> with expertise in building modern, scalable web applications. 
                  Based in Kathmandu, I've established myself as one of the <strong>top software engineers in Nepal</strong>, specializing in full-stack development with JavaScript, React, Node.js, and Python. I deliver innovative software solutions for clients across Nepal and internationally.
                </p>
                <p className="text-lg leading-relaxed text-muted-foreground mb-6">
                  As an <strong>expert software developer in Nepal</strong>, my approach emphasizes clean code architecture, performance optimization, 
                  and user-centric design. I've helped numerous businesses in Nepal transform their digital presence through custom web applications, 
                  e-commerce platforms, and enterprise software solutions.
                </p>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Whether you need a <strong>professional software developer in Nepal</strong> for your startup, enterprise application development, 
                  or technical consultation, I bring years of experience in modern web technologies and a deep understanding of the Nepali market 
                  to deliver solutions that drive real business growth.
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
                  <div className="h-3 bg-muted rounded-full overflow-hidden relative">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${skill.color} glow-border rounded-full`}
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
