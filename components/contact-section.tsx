"use client"

import type React from "react"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Github, Linkedin, Mail, Send } from "lucide-react"
import { getSocialUrls } from "@/lib/utils"

export default function ContactSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const socialUrls = getSocialUrls()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log("Form submitted:", formData)
  }

  return (
    <section id="contact" className="relative py-32 px-4 mb-16" ref={ref}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center glow-text font-mono">Get In Touch</h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-8 glow-border" />
          <p className="text-center text-muted-foreground mb-16 text-lg">
            Interested in collaborating? Let's discuss your project and bring your ideas to life together.
          </p>

          <div className="grid md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/20 glow-border h-full">
                <h3 className="text-2xl font-bold mb-6 text-foreground font-mono">Contact Information</h3>

                <div className="space-y-6">
                  <a
                    href={`mailto:${socialUrls.email}`}
                    className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-colors group"
                    aria-label={`Send email to ${socialUrls.email}`}
                    title="Send Email"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-mono">{socialUrls.email}</p>
                    </div>
                  </a>

                  <a
                    href={socialUrls.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-colors group"
                    aria-label="Visit Devendra Hamal's GitHub profile"
                    title="GitHub Profile"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Github className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">GitHub</p>
                      <p className="font-mono">@{socialUrls.github.split('/').pop()}</p>
                    </div>
                  </a>

                  <a
                    href={socialUrls.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-colors group"
                    aria-label="Connect with Devendra Hamal on LinkedIn"
                    title="LinkedIn Profile"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Linkedin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">LinkedIn</p>
                      <p className="font-mono">@{socialUrls.linkedin.split('/').pop()}</p>
                    </div>
                  </a>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Card className="p-8 bg-card/50 backdrop-blur-sm border-primary/20 glow-border">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="contact-name" className="sr-only">
                      Your Name
                    </label>
                    <Input
                      id="contact-name"
                      placeholder="Your Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-background/50 border-primary/30 focus:border-primary glow-border font-mono"
                      required
                      aria-label="Your Name"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="sr-only">
                      Your Email
                    </label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="Your Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-background/50 border-primary/30 focus:border-primary glow-border font-mono"
                      required
                      aria-label="Your Email Address"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="sr-only">
                      Your Message
                    </label>
                    <Textarea
                      id="contact-message"
                      placeholder="Your Message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="bg-background/50 border-primary/30 focus:border-primary glow-border min-h-[150px] font-mono"
                      required
                      aria-label="Your Message"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-border font-mono transition-all hover:scale-105"
                    size="lg"
                    aria-label="Send message to Devendra Hamal"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
