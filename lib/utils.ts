import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get the base URL for the application
export function getBaseUrl(): string {
  // For client-side, use NEXT_PUBLIC_URL if available, otherwise fallback to current location
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_URL || window.location.origin
  }
  
  // For server-side, use NEXT_PUBLIC_URL or fallback
  return process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
}

// Helper function to get full URL for assets
export function getAssetUrl(path: string): string {
  const baseUrl = getBaseUrl()
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${normalizedPath}`
}

// Get social media URLs from environment variables with fallbacks
export function getSocialUrls(): {
  github: string;
  linkedin: string;
  email: string;
} {
  return {
    github: process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/Devendra000',
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || 'https://linkedin.com/in/devendra-hamal',
    email: process.env.NEXT_PUBLIC_EMAIL || 'devendra.hamal058@gmail.com'
  }
}
