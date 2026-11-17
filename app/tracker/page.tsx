import type { Metadata } from 'next'
import { requireSession } from '@/lib/auth/dal'
import { listApplications } from '@/lib/tracker/db'
import { Tracker } from './tracker'

export const metadata: Metadata = { title: 'Application tracker', robots: { index: false, follow: false } }

export default async function TrackerPage() {
  await requireSession()
  const applications = await listApplications()
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Tracker initial={applications} />
    </main>
  )
}
