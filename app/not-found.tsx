import type { Metadata } from 'next'
import { Footer } from '@/components/site/footer'
import { Header } from '@/components/site/header'
import { IncidentReport } from '@/components/site/incident-report'

export const metadata: Metadata = { title: '404 — Incident report' }

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="bg-grid px-4 py-16 sm:px-6 sm:py-24">
        <IncidentReport />
      </main>
      <Footer />
    </>
  )
}
