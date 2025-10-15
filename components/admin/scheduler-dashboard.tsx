"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Play, Square, Zap, Settings } from 'lucide-react'

interface JobStatus {
  id: string
  name: string
  intervalMs: number
  isRunning: boolean
  lastRun?: string
  nextRun?: string
  runCount: number
}

export default function SchedulerDashboard() {
  const [jobs, setJobs] = useState<JobStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchJobStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/scheduler?action=status')
      const data = await response.json()
      setJobs(data.jobs || [])
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch job status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJobAction = async (action: string, jobId?: string) => {
    setLoading(true)
    try {
      const url = jobId 
        ? `/api/scheduler?action=${action}&jobId=${jobId}`
        : `/api/scheduler?action=${action}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success !== false) {
        await fetchJobStatus() // Refresh status
      }
      
      console.log(`${action} result:`, data)
    } catch (error) {
      console.error(`Failed to ${action}:`, error)
    } finally {
      setLoading(false)
    }
  }

  const initializeGitHubJob = async () => {
    await handleJobAction('init-github')
  }

  const formatInterval = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  useEffect(() => {
    fetchJobStatus()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchJobStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Scheduler Dashboard</h1>
        <div className="flex gap-2">
          <Button
            onClick={fetchJobStatus}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={initializeGitHubJob}
            disabled={loading}
            size="sm"
          >
            <Settings className="w-4 h-4 mr-2" />
            Init GitHub Job
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>

      {jobs.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No scheduled jobs found</p>
            <p className="mb-4">Initialize the GitHub OAuth job to get started</p>
            <Button onClick={initializeGitHubJob} disabled={loading}>
              <Settings className="w-4 h-4 mr-2" />
              Initialize GitHub Job
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Card key={job.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{job.name}</h3>
                  <p className="text-sm text-muted-foreground">ID: {job.id}</p>
                </div>
                <Badge 
                  variant={job.isRunning ? "default" : "secondary"}
                  className={job.isRunning ? "bg-green-500" : ""}
                >
                  {job.isRunning ? "Running" : "Stopped"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Interval</p>
                  <p className="font-medium">{formatInterval(job.intervalMs)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Run Count</p>
                  <p className="font-medium">{job.runCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Run</p>
                  <p className="font-medium">
                    {job.lastRun 
                      ? new Date(job.lastRun).toLocaleString()
                      : 'Never'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Next Run</p>
                  <p className="font-medium">
                    {job.nextRun 
                      ? new Date(job.nextRun).toLocaleString()
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {job.isRunning ? (
                  <Button
                    onClick={() => handleJobAction('stop', job.id)}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleJobAction('start', job.id)}
                    disabled={loading}
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </Button>
                )}
                
                <Button
                  onClick={() => handleJobAction('trigger', job.id)}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Trigger Now
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="p-4 bg-muted/50">
        <h3 className="font-semibold mb-2">Bulk Actions</h3>
        <div className="flex gap-2">
          <Button
            onClick={() => handleJobAction('start-all')}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <Play className="w-4 h-4 mr-2" />
            Start All Jobs
          </Button>
          <Button
            onClick={() => handleJobAction('stop-all')}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop All Jobs
          </Button>
        </div>
      </Card>
    </div>
  )
}