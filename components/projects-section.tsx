"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Github, Calendar, Star, ChevronLeft, ChevronRight } from "lucide-react"
import { getAssetUrl } from "@/lib/utils"
import projectsData from "@/data/projects.json"

interface Project {
  id: number
  title: string
  description: string
  longDescription: string
  tech: string[]
  image: string
  images?: string[]
  github: string
  demo: string
  featured: boolean
  status: string
  visible: boolean
  startDate: string
  endDate: string
  category: string
  highlights: string[]
}

export default function ProjectsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [projects, setProjects] = useState<Project[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({})

  useEffect(() => {
    setProjects(projectsData.projects as Project[])
  }, [])

  const handlePrevImage = (projectId: number, totalImages: number) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [projectId]: ((prev[projectId] || 0) - 1 + totalImages) % totalImages
    }))
  }

  const handleNextImage = (projectId: number, totalImages: number) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [projectId]: ((prev[projectId] || 0) + 1) % totalImages
    }))
  }

  const filteredProjects = selectedCategory === "All" 
    ? projects.filter(project => project.featured && project.visible !== false)
    : projects.filter(project => project.category === selectedCategory && project.visible !== false)

  const categories = projectsData.categories

  return (
    <section id="projects" className="relative py-32 px-4" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center glow-text font-mono">Featured Projects</h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-8 glow-border" />
          
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            Explore my portfolio of innovative software solutions, from full-stack web applications 
            to data visualization platforms. Each project demonstrates my expertise in modern 
            technologies and commitment to delivering high-quality software.
          </p>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-mono text-sm transition-all hover:scale-105 ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground glow-border"
                    : "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {filteredProjects.map((project, index) => (
              <a 
                key={project.id}
                href={project.demo} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
                aria-label={`View ${project.title} live demo`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  onHoverStart={() => setHoveredIndex(index)}
                  onHoverEnd={() => setHoveredIndex(null)}
                >
                  <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/50 transition-all duration-300 h-full group cursor-pointer">
                  <div className="relative overflow-hidden">
                    {/* Image Carousel */}
                    {project.images && project.images.length > 0 ? (
                      <div className="relative group/carousel">
                        <img
                          src={project.images[currentImageIndex[project.id] || 0] || "placeholder.svg"}
                          alt={`${project.title} - Image ${(currentImageIndex[project.id] || 0) + 1}`}
                          className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        
                        {/* Navigation Buttons */}
                        {project.images.length > 1 && (
                          <>
                            <button
                              onClick={() => handlePrevImage(project.id, project.images!.length)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground p-2 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
                              aria-label="Previous image"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleNextImage(project.id, project.images!.length)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground p-2 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10"
                              aria-label="Next image"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                            
                            {/* Dots Indicator */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                              {project.images.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setCurrentImageIndex(prev => ({ ...prev, [project.id]: idx }))}
                                  className={`w-2 h-2 rounded-full transition-all ${
                                    (currentImageIndex[project.id] || 0) === idx 
                                      ? "bg-primary w-6" 
                                      : "bg-primary/40 hover:bg-primary/60"
                                  }`}
                                  aria-label={`Go to image ${idx + 1}`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <img
                        src={project.image ? getAssetUrl(project.image) : getAssetUrl("placeholder.svg")}
                        alt={project.title}
                        className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    )}
                    
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: hoveredIndex === index ? 0.9 : 0.5 }}
                      transition={{ duration: 0.3 }}
                    />
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 left-4 z-20">
                      <Badge 
                        variant={project.status === "completed" ? "default" : "secondary"}
                        className="bg-primary/20 text-primary border-primary/50 backdrop-blur-sm"
                      >
                        {project.featured && <Star className="w-3 h-3 mr-1" />}
                        {project.status === "completed" ? "Completed" : "In Progress"}
                      </Badge>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-4 right-4 z-20">
                      <Badge variant="outline" className="bg-background/20 backdrop-blur-sm">
                        {project.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-2xl font-bold mb-2 text-foreground font-mono group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    
                    {/* Date Range */}
                    <div className="flex items-center text-sm text-muted-foreground mb-3">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>

                    <p className="text-muted-foreground mb-4 leading-relaxed">{project.description}</p>

                    {/* Key Highlights */}
                    {project.highlights && project.highlights.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-foreground mb-2">Key Features:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {project.highlights.slice(0, 3).map((highlight, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-primary mr-2">•</span>
                              {highlight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mb-6">
                      {project.tech.map((tech) => (
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
                        size="sm" 
                        className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-105 w-full" 
                        asChild
                      >
                        <span className="cursor-pointer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Demo
                        </span>
                      </Button>
                    </div>
                  </div>
                </Card>
                </motion.div>
              </a>
            ))}
          </div>

          {/* GitHub Profile Link */}
          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <p className="text-muted-foreground mb-6">
              Want to see more? Check out my GitHub profile for additional projects and contributions.
            </p>
            <Button
              variant="outline"
              size="lg"
              className="border-primary/50 text-primary hover:bg-primary/10 bg-transparent transition-all hover:scale-105 font-mono"
              asChild
            >
              <a 
                href="https://github.com/Devendra000" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Visit Devendra Hamal's complete GitHub profile"
                title="View All GitHub Repositories"
              >
                <Github className="w-5 h-5 mr-2" />
                View GitHub Profile
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
