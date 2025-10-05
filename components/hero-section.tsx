"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowDown, Github, Linkedin, Mail } from "lucide-react"
import { getSocialUrls } from "@/lib/utils"

export default function HeroSection() {
  const socialUrls = getSocialUrls()

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4">
      <div className="max-w-6xl mx-auto text-center z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <motion.h1
            className="text-6xl md:text-8xl font-bold mb-6 glow-text font-mono text-foreground"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Devendra Hamal
          </motion.h1>

          <motion.div
            className="text-xl md:text-2xl text-muted-foreground mb-4 font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <span className="text-primary glow-text">Software Engineer</span>
            <span className="mx-3 text-muted-foreground">•</span>
            <span className="text-muted-foreground">Full Stack</span>
            <span className="mx-3 text-muted-foreground">•</span>
            <span className="text-muted-foreground">React</span>
            <span className="mx-3 text-muted-foreground">•</span>
            <span className="text-muted-foreground">Node.js</span>
          </motion.div>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Passionate about creating innovative digital solutions. Specializing in full-stack development with modern 
            JavaScript technologies, building scalable applications that deliver exceptional user experiences.
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-4 justify-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Button
              size="lg"
              className="glow-border bg-primary text-primary-foreground hover:bg-primary/90 font-mono transition-all hover:scale-105"
              onClick={() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })}
            >
              View Projects
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="glow-border border-primary/50 text-primary hover:bg-primary/10 font-mono bg-transparent transition-all hover:scale-105"
              onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
            >
              Contact Me
            </Button>
          </motion.div>

          <motion.div
            className="flex gap-6 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <a
              href={socialUrls.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors transform hover:scale-110"
            >
              <Github className="w-6 h-6" />
            </a>
            <a
              href={socialUrls.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors transform hover:scale-110"
            >
              <Linkedin className="w-6 h-6" />
            </a>
            <a
              href={`mailto:${socialUrls.email}`}
              className="text-muted-foreground hover:text-primary transition-colors transform hover:scale-110"
            >
              <Mail className="w-6 h-6" />
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1,
            delay: 1.2,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
        >
          <ArrowDown className="w-6 h-6 text-primary" />
        </motion.div>
      </div>
    </section>
  )
}
