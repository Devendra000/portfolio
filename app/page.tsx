import HeroSection from "@/components/hero-section"
import AboutSection from "@/components/about-section"
import ProjectsSection from "@/components/projects-section"
import TechStackSection from "@/components/tech-stack-section"
import ContactSection from "@/components/contact-section"
import ParticleBackground from "@/components/particle-background"

export default function Home() {
  return (
    <>
      <ParticleBackground />
      
      {/* Hero Section */}
      <section aria-label="Introduction and welcome">
        <HeroSection />
      </section>
      
      {/* About Section */}
      <section aria-label="About and skills">
        <AboutSection />
      </section>
      
      {/* Projects Portfolio */}
      {/* <section aria-label="Portfolio projects">
        <ProjectsSection />
      </section> */}
      
      {/* Technology Stack */}
      <section aria-label="Technical skills and tools">
        <TechStackSection />
      </section>
      
      {/* Contact Information */}
      <section aria-label="Contact information and form">
        <ContactSection />
      </section>
    </>
  )
}
