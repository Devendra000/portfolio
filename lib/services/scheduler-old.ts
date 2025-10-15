interface ScheduledJob {
  id: string
  name: string
  intervalMs: number
  task: () => Promise<void>
  isRunning: boolean
  intervalId?: NodeJS.Timeout
  lastRun?: Date
  nextRun?: Date
  runCount: number
}

class SchedulerService {
  private jobs: Map<string, ScheduledJob> = new Map()

  constructor() {
    console.log('Scheduler Service initialized')
  }

  /**
   * Add a new scheduled job
   * @param id - Unique identifier for the job
   * @param name - Human readable name  
   * @param intervalMs - Interval in milliseconds (e.g., 5 * 60 * 60 * 1000 for 5 hours)
   * @param task - Async function to execute
   */
  addJob(id: string, name: string, intervalMs: number, task: () => Promise<void>): ScheduledJob {
    if (this.jobs.has(id)) {
      throw new Error(`Job with id '${id}' already exists`)
    }

    const scheduledJob: ScheduledJob = {
      id,
      name,
      cronExpression,
      task,
      isRunning: false,
      runCount: 0
    }

    this.jobs.set(id, scheduledJob)
    console.log(`Job '${name}' (${id}) added with schedule: ${cronExpression}`)
    
    return scheduledJob
  }

  /**
   * Start a specific job
   */
  startJob(id: string): boolean {
    const jobData = this.jobs.get(id)
    if (!jobData) {
      throw new Error(`Job with id '${id}' not found`)
    }

    if (jobData.isRunning) {
      return false // Already running
    }

    try {
      const cronJob = new CronJob(
        jobData.cronExpression,
        async () => {
          console.log(`[${new Date().toISOString()}] Executing job: ${jobData.name}`)
          jobData.lastRun = new Date()
          jobData.runCount++
          
          try {
            await jobData.task()
            console.log(`[${new Date().toISOString()}] Job completed: ${jobData.name}`)
          } catch (error) {
            console.error(`[${new Date().toISOString()}] Job failed: ${jobData.name}`, error)
          }
        },
        null,
        true, // Start immediately
        'UTC'
      )

      jobData.job = cronJob
      jobData.isRunning = true
      jobData.nextRun = cronJob.nextDate().toDate()

      console.log(`Job '${jobData.name}' started. Next run: ${jobData.nextRun}`)
      return true
    } catch (error) {
      console.error(`Failed to start job '${jobData.name}':`, error)
      return false
    }
  }

  /**
   * Stop a specific job
   */
  stopJob(id: string): boolean {
    const jobData = this.jobs.get(id)
    if (!jobData) {
      throw new Error(`Job with id '${id}' not found`)
    }

    if (!jobData.isRunning) {
      return false // Already stopped
    }

    if (jobData.job) {
      jobData.job.stop()
      jobData.job = undefined
    }

    jobData.isRunning = false
    jobData.nextRun = undefined

    console.log(`Job '${jobData.name}' stopped`)
    return true
  }

  /**
   * Start all jobs
   */
  startAllJobs() {
    let started = 0
    for (const [id, _] of this.jobs) {
      if (this.startJob(id)) {
        started++
      }
    }
    console.log(`Started ${started} jobs`)
    return started
  }

  /**
   * Stop all jobs
   */
  stopAllJobs() {
    let stopped = 0
    for (const [id, _] of this.jobs) {
      if (this.stopJob(id)) {
        stopped++
      }
    }
    console.log(`Stopped ${stopped} jobs`)
    return stopped
  }

  /**
   * Get job status
   */
  getJobStatus(id: string) {
    const jobData = this.jobs.get(id)
    if (!jobData) {
      return null
    }

    return {
      id: jobData.id,
      name: jobData.name,
      cronExpression: jobData.cronExpression,
      isRunning: jobData.isRunning,
      lastRun: jobData.lastRun,
      nextRun: jobData.nextRun,
      runCount: jobData.runCount
    }
  }

  /**
   * Get all jobs status
   */
  getAllJobsStatus() {
    const statuses = []
    for (const [id, _] of this.jobs) {
      statuses.push(this.getJobStatus(id))
    }
    return statuses
  }

  /**
   * Remove a job
   */
  removeJob(id: string): boolean {
    const jobData = this.jobs.get(id)
    if (!jobData) {
      return false
    }

    this.stopJob(id)
    this.jobs.delete(id)
    console.log(`Job '${jobData.name}' removed`)
    return true
  }

  /**
   * Manually trigger a job
   */
  async triggerJob(id: string) {
    const jobData = this.jobs.get(id)
    if (!jobData) {
      throw new Error(`Job with id '${id}' not found`)
    }

    console.log(`[${new Date().toISOString()}] Manually triggering job: ${jobData.name}`)
    jobData.lastRun = new Date()
    jobData.runCount++

    try {
      await jobData.task()
      console.log(`[${new Date().toISOString()}] Manual job completed: ${jobData.name}`)
      return { status: 'success', timestamp: new Date() }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Manual job failed: ${jobData.name}`, error)
      throw error
    }
  }
}

// Singleton instance
export const scheduler = new SchedulerService()

// GitHub OAuth task function
export async function githubOAuthTask() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/github`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Devendra-Hamal-Portfolio-Scheduler/1.0'
      }
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(`GitHub OAuth request failed: ${data.error || 'Unknown error'}`)
    }

    console.log('GitHub OAuth task completed successfully:', data)
    return data
  } catch (error) {
    console.error('GitHub OAuth task error:', error)
    throw error
  }
}

// Initialize GitHub OAuth job
export function initializeGitHubOAuthJob() {
  try {
    // Add the GitHub OAuth job - runs every 5 hours
    scheduler.addJob(
      'github-oauth',
      'GitHub OAuth Token Request',
      '0 */5 * * *', // Every 5 hours
      githubOAuthTask
    )

    // Start the job
    scheduler.startJob('github-oauth')
    
    console.log('GitHub OAuth cron job initialized and started')
    return true
  } catch (error) {
    console.error('Failed to initialize GitHub OAuth job:', error)
    return false
  }
}

export default scheduler