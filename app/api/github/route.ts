import { NextRequest, NextResponse } from 'next/server'

interface GitHubTokenResponse {
  access_token?: string
  token_type?: string
  scope?: string
  error?: string
  error_description?: string
}

interface GitHubRequestBody {
  client_id: string
  client_secret: string
  code?: string
  redirect_uri?: string
}

export async function GET(request: NextRequest) {
  try {
    // Log the request attempt
    console.log(`[${new Date().toISOString()}] GitHub OAuth token request initiated`)

    // Get environment variables
    const clientId = process.env.GITHUB_CLIENT_ID
    const clientSecret = process.env.GITHUB_CLIENT_SECRET
    const code = process.env.GITHUB_CODE // Optional: authorization code if needed

    if (!clientId || !clientSecret) {
      console.error('Missing GitHub OAuth credentials')
      return NextResponse.json(
        { 
          error: 'Missing GitHub OAuth credentials',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // Prepare request body
    const requestBody: GitHubRequestBody = {
      client_id: clientId,
      client_secret: clientSecret,
    }

    // Add authorization code if available
    if (code) {
      requestBody.code = code
      requestBody.redirect_uri = process.env.GITHUB_REDIRECT_URI || 'https://devendrahamal.com.np/auth/callback'
    }

    // Make request to GitHub OAuth endpoint
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST', // Note: GitHub OAuth endpoint typically uses POST, not GET
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Devendra-Hamal-Portfolio/1.0',
      },
      body: JSON.stringify(requestBody)
    })

    const data: GitHubTokenResponse = await response.json()

    // Log the response
    if (data.error) {
      console.error(`GitHub OAuth Error: ${data.error} - ${data.error_description}`)
      return NextResponse.json(
        { 
          error: data.error,
          description: data.error_description,
          timestamp: new Date().toISOString(),
          status: 'failed'
        },
        { status: 400 }
      )
    }

    console.log(`[${new Date().toISOString()}] GitHub OAuth token request successful`)

    // Return success response (without exposing the actual token for security)
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      token_type: data.token_type,
      scope: data.scope,
      has_token: !!data.access_token
    })

  } catch (error) {
    console.error('GitHub OAuth request failed:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Allow manual trigger with custom parameters
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Devendra-Hamal-Portfolio/1.0',
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    
    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      response: data
    })

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Request failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}