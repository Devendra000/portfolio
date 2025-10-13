// GitHub API utilities for fetching repository data
// This can be used to dynamically load repositories from GitHub

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  languages_url: string
  stargazers_count: number
  forks_count: number
  created_at: string
  updated_at: string
  pushed_at: string
  topics: string[]
  visibility: string
}

export interface ProcessedProject {
  id: number
  title: string
  description: string
  tech: string[]
  image: string
  github: string
  demo: string
  stars: number
  forks: number
  language: string
  lastUpdated: string
  topics: string[]
}

/**
 * Fetch repositories from GitHub API
 * @param username - GitHub username
 * @param options - Additional options for filtering
 */
export async function fetchGitHubRepos(
  username: string,
  options: {
    sort?: 'created' | 'updated' | 'pushed' | 'full_name'
    direction?: 'asc' | 'desc'
    per_page?: number
    type?: 'all' | 'owner' | 'member'
  } = {}
): Promise<GitHubRepo[]> {
  const {
    sort = 'updated',
    direction = 'desc',
    per_page = 30,
    type = 'owner'
  } = options

  try {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=${sort}&direction=${direction}&per_page=${per_page}&type=${type}`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          // Add GitHub token if available for higher rate limits
          ...(process.env.GITHUB_TOKEN && {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`
          })
        }
      }
    )

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error)
    return []
  }
}

/**
 * Fetch languages used in a repository
 * @param username - GitHub username
 * @param repoName - Repository name
 */
export async function fetchRepoLanguages(
  username: string,
  repoName: string
): Promise<Record<string, number>> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${username}/${repoName}/languages`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN && {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`
          })
        }
      }
    )

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching repository languages:', error)
    return {}
  }
}

/**
 * Process GitHub repositories into project format
 * @param repos - Array of GitHub repositories
 * @param featuredRepos - Array of repository names to mark as featured
 */
export function processGitHubRepos(
  repos: GitHubRepo[],
  featuredRepos: string[] = []
): ProcessedProject[] {
  return repos
    .filter(repo => !repo.name.includes('.github.io') && repo.description) // Filter out GitHub Pages and repos without description
    .map(repo => ({
      id: repo.id,
      title: formatRepoName(repo.name),
      description: repo.description || 'No description available',
      tech: repo.topics.length > 0 ? repo.topics : repo.language ? [repo.language] : ['Unknown'],
      image: `${repo.name.toLowerCase()}.webp`, // Assumes you have images named after repos
      github: repo.html_url,
      demo: repo.homepage || `https://${repo.full_name.replace('/', '.github.io')}`,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language || 'Unknown',
      lastUpdated: repo.updated_at,
      topics: repo.topics
    }))
}

/**
 * Format repository name for display
 * @param repoName - Repository name from GitHub
 */
function formatRepoName(repoName: string): string {
  return repoName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get project categories based on repository topics and languages
 * @param projects - Array of processed projects
 */
export function getProjectCategories(projects: ProcessedProject[]): string[] {
  const categories = new Set<string>(['All'])
  
  projects.forEach(project => {
    // Add categories based on topics
    project.topics.forEach(topic => {
      if (topic.includes('web')) categories.add('Web Development')
      if (topic.includes('mobile')) categories.add('Mobile')
      if (topic.includes('data')) categories.add('Data Science')
      if (topic.includes('api')) categories.add('Backend')
      if (topic.includes('frontend')) categories.add('Frontend')
    })
    
    // Add categories based on primary language
    if (project.language) {
      if (['JavaScript', 'TypeScript', 'React'].includes(project.language)) {
        categories.add('Frontend')
      }
      if (['Node.js', 'Python', 'Go', 'Java'].includes(project.language)) {
        categories.add('Backend')
      }
      if (project.language === 'Python') {
        categories.add('Data Science')
      }
    }
  })
  
  return Array.from(categories)
}

/**
 * Example usage function (for reference)
 */
export async function loadGitHubProjects(username: string = 'Devendra000') {
  try {
    const repos = await fetchGitHubRepos(username, {
      sort: 'updated',
      per_page: 20
    })
    
    const featuredRepos = [
      'ecommerce-platform',
      'realtime-chat-app',
      'data-visualization-dashboard',
      'task-management-platform'
    ]
    
    const projects = processGitHubRepos(repos, featuredRepos)
    const categories = getProjectCategories(projects)
    
    return { projects, categories }
  } catch (error) {
    console.error('Failed to load GitHub projects:', error)
    return { projects: [], categories: ['All'] }
  }
}