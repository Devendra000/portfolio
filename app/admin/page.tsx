import { Metadata } from 'next'
import SchedulerDashboard from '@/components/admin/scheduler-dashboard'

export const metadata: Metadata = {
  title: 'Admin - Scheduler Dashboard | Devendra Hamal',
  description: 'Admin dashboard for managing scheduled tasks and jobs',
  robots: {
    index: false,
    follow: false
  }
}

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background py-8">
      <SchedulerDashboard />
    </div>
  )
}