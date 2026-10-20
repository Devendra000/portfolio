import { About } from '@/components/site/about'
import { CaseStudies } from '@/components/site/case-studies'
import { Contact } from '@/components/site/contact'
import { Footer } from '@/components/site/footer'
import { Header } from '@/components/site/header'
import { Hero } from '@/components/site/hero'
import { StatusDashboard } from '@/components/site/status-dashboard'
import { Testimonials } from '@/components/site/testimonials'

export default function Home() {
  return (
    <>
      <Header />
      <main id="main" className="relative">
        <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[680px] [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
        <div className="mx-auto max-w-6xl space-y-28 px-4 pb-28 sm:px-6">
          <Hero />
          <StatusDashboard />
          <CaseStudies />
          <About />
          <Testimonials />
          <Contact />
        </div>
      </main>
      <Footer />
    </>
  )
}
