import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Built once at build time: on Vercel, public/ isn't on the function's disk at runtime.
export const dynamic = 'force-static'

export async function GET() {
  try {
    const musicDir = path.join(process.cwd(), 'public', 'music')
    if (!fs.existsSync(musicDir)) {
      return NextResponse.json({ files: [] })
    }
    const files = fs.readdirSync(musicDir)
    const audioFiles = files.filter(file => 
      file.endsWith('.mp3') || 
      file.endsWith('.wav') || 
      file.endsWith('.ogg') ||
      file.endsWith('.m4a')
    )
    return NextResponse.json({ files: audioFiles })
  } catch (error) {
    console.error('Failed to read music directory:', error)
    return NextResponse.json({ files: [] })
  }
}
