import { NextRequest, NextResponse } from 'next/server'

interface CronJobLog {
  id: string
  timestamp: string
  status: 'success' | 'failed' | 'running'
  response?: any
  error?: string
  duration?: number
}

// In-memory storage for demonstration (use database in production)
let cronLogs: CronJobLog[] = []
let isRunning = false
let cronInterval: NodeJS.Timeout | null = null

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'start':
        return startCronJob()
      
      case 'stop':
        return stopCronJob()
      
      case 'status':
        return getCronStatus()
      
      case 'logs':
        return getCronLogs()
      
      case 'trigger':
        return await triggerManualRun()
      
      default:
        return NextResponse.json({
          message: 'GitHub OAuth Cron Job API',
          available_actions: ['start', 'stop', 'status', 'logs', 'trigger'],
          current_status: isRunning ? 'running' : 'stopped',
          logs_count: cronLogs.length,
          next_run: cronInterval ? 'Every 5 hours' : 'Not scheduled'
        })
    }
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Cron job operation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function startCronJob() {
  if (isRunning) {
    return NextResponse.json({
      message: 'Cron job is already running',
      status: 'running',
      interval: '5 hours'
    })
  }

  // Start the cron job - runs every 5 hours (5 * 60 * 60 * 1000 milliseconds)
  cronInterval = setInterval(async () => {
    await executeGitHubRequest()
  }, 5 * 60 * 60 * 1000)

  isRunning = true

  // Also trigger an immediate run
  executeGitHubRequest()

  addLog('cron-start', 'success', { message: 'Cron job started successfully' })

  return NextResponse.json({
    message: 'GitHub OAuth cron job started successfully',
    status: 'running',
    interval: '5 hours',
    next_run: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString()
  })
}

function stopCronJob() {
  if (!isRunning) {
    return NextResponse.json({
      message: 'Cron job is not running',
      status: 'stopped'
    })
  }

  if (cronInterval) {
    clearInterval(cronInterval)
    cronInterval = null
  }

  isRunning = false
  addLog('cron-stop', 'success', { message: 'Cron job stopped successfully' })

  return NextResponse.json({
    message: 'GitHub OAuth cron job stopped successfully',
    status: 'stopped'
  })
}

function getCronStatus() {
  return NextResponse.json({
    status: isRunning ? 'running' : 'stopped',
    interval: isRunning ? '5 hours' : null,
    next_run: isRunning ? new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString() : null,
    total_runs: cronLogs.length,
    last_run: cronLogs.length > 0 ? cronLogs[cronLogs.length - 1] : null
  })
}

function getCronLogs() {
  return NextResponse.json({
    logs: cronLogs.slice(-20), // Return last 20 logs
    total_count: cronLogs.length,
    running: isRunning
  })
}

async function triggerManualRun() {
  const result = await executeGitHubRequest()
  return NextResponse.json({
    message: 'Manual GitHub OAuth request triggered',
    result
  })
}

async function executeGitHubRequest() {
  const startTime = Date.now()
  const logId = `run-${Date.now()}`

  try {
    console.log(`[${new Date().toISOString()}] Executing scheduled GitHub OAuth request`)

    // Make request to our GitHub API endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/github`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const data = await response.json()
    const duration = Date.now() - startTime

    if (response.ok) {
      addLog(logId, 'success', data, duration)
      console.log(`[${new Date().toISOString()}] GitHub OAuth request completed successfully in ${duration}ms`)
      return { status: 'success', data, duration }
    } else {
      addLog(logId, 'failed', data, duration)
      console.error(`[${new Date().toISOString()}] GitHub OAuth request failed:`, data)
      return { status: 'failed', error: data, duration }
    }

  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    addLog(logId, 'failed', { error: errorMessage }, duration)
    console.error(`[${new Date().toISOString()}] GitHub OAuth request error:`, error)
    return { status: 'failed', error: errorMessage, duration }
  }
}

function addLog(id: string, status: 'success' | 'failed', response?: any, duration?: number) {
  const log: CronJobLog = {
    id,
    timestamp: new Date().toISOString(),
    status,
    response,
    duration
  }

  cronLogs.push(log)

  // Keep only last 100 logs to prevent memory issues
  if (cronLogs.length > 100) {
    cronLogs = cronLogs.slice(-100)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, interval } = body

    if (action === 'start' && interval) {
      // Custom interval (in milliseconds)
      if (isRunning) {
        stopCronJob()
      }

      cronInterval = setInterval(async () => {
        await executeGitHubRequest()
      }, interval)

      isRunning = true

      return NextResponse.json({
        message: `Custom cron job started with ${interval}ms interval`,
        status: 'running',
        interval: `${interval / 1000} seconds`
      })
    }

    return NextResponse.json(
      { error: 'Invalid action or missing interval' },
      { status: 400 }
    )

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}