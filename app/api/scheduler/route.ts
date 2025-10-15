import { NextRequest, NextResponse } from 'next/server'
import { scheduler, initializeGitHubOAuthJob } from '@/lib/services/scheduler'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const jobId = searchParams.get('jobId')

  try {
    switch (action) {
      case 'status':
        if (jobId) {
          const status = scheduler.getJobStatus(jobId)
          if (!status) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 })
          }
          return NextResponse.json({ job: status })
        } else {
          const allStatuses = scheduler.getAllJobsStatus()
          return NextResponse.json({ jobs: allStatuses })
        }

      case 'start':
        if (!jobId) {
          return NextResponse.json({ error: 'jobId required for start action' }, { status: 400 })
        }
        const started = scheduler.startJob(jobId)
        return NextResponse.json({ 
          success: started, 
          message: started ? 'Job started successfully' : 'Job was already running'
        })

      case 'stop':
        if (!jobId) {
          return NextResponse.json({ error: 'jobId required for stop action' }, { status: 400 })
        }
        const stopped = scheduler.stopJob(jobId)
        return NextResponse.json({ 
          success: stopped, 
          message: stopped ? 'Job stopped successfully' : 'Job was already stopped'
        })

      case 'start-all':
        const startedCount = scheduler.startAllJobs()
        return NextResponse.json({ 
          success: true, 
          message: `Started ${startedCount} jobs`
        })

      case 'stop-all':
        const stoppedCount = scheduler.stopAllJobs()
        return NextResponse.json({ 
          success: true, 
          message: `Stopped ${stoppedCount} jobs`
        })

      case 'trigger':
        if (!jobId) {
          return NextResponse.json({ error: 'jobId required for trigger action' }, { status: 400 })
        }
        try {
          const result = await scheduler.triggerJob(jobId)
          return NextResponse.json({ 
            success: true, 
            message: 'Job triggered successfully',
            result
          })
        } catch (error) {
          return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Job execution failed'
          }, { status: 500 })
        }

      case 'init-github':
        const initialized = initializeGitHubOAuthJob()
        return NextResponse.json({ 
          success: initialized, 
          message: initialized ? 'GitHub OAuth job initialized' : 'Failed to initialize GitHub OAuth job'
        })

      default:
        return NextResponse.json({
          message: 'Scheduler Management API',
          available_actions: [
            'status - Get job status (optional: ?jobId=<id>)',
            'start - Start a job (?jobId=<id>)',
            'stop - Stop a job (?jobId=<id>)',
            'start-all - Start all jobs',
            'stop-all - Stop all jobs', 
            'trigger - Manually trigger a job (?jobId=<id>)',
            'init-github - Initialize GitHub OAuth job'
          ],
          example_usage: [
            '/api/scheduler?action=status',
            '/api/scheduler?action=start&jobId=github-oauth',
            '/api/scheduler?action=trigger&jobId=github-oauth'
          ]
        })
    }
  } catch (error) {
    console.error('Scheduler API error:', error)
    return NextResponse.json(
      { 
        error: 'Scheduler operation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, jobId, intervalMs, name } = body

    switch (action) {
      case 'add-job':
        if (!jobId || !name || !intervalMs) {
          return NextResponse.json(
            { error: 'jobId, name, and intervalMs are required' },
            { status: 400 }
          )
        }

        // For now, we only support GitHub OAuth jobs
        if (jobId !== 'github-oauth') {
          return NextResponse.json(
            { error: 'Only github-oauth job type is supported' },
            { status: 400 }
          )
        }

        const success = initializeGitHubOAuthJob()
        return NextResponse.json({
          success,
          message: success ? 'Job added successfully' : 'Failed to add job'
        })

      case 'remove-job':
        if (!jobId) {
          return NextResponse.json(
            { error: 'jobId is required' },
            { status: 400 }
          )
        }

        const removed = scheduler.removeJob(jobId)
        return NextResponse.json({
          success: removed,
          message: removed ? 'Job removed successfully' : 'Job not found'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: add-job, remove-job' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Scheduler POST API error:', error)
    return NextResponse.json(
      { 
        error: 'Request failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}