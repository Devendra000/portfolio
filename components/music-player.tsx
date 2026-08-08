'use client'

import { useState, useEffect, useRef } from 'react'

export function MusicPlayer() {
  const [playlist, setPlaylist] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const fetchMusic = async () => {
      try {
        const res = await fetch('/api/music')
        const data = await res.json()
        if (data.files && data.files.length > 0) {
          setPlaylist(data.files)
        }
      } catch (error) {
        console.error('Failed to fetch music playlist', error)
      }
    }
    fetchMusic()
  }, [])

  useEffect(() => {
    if (audioRef.current && playlist.length > 0) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          setIsPlaying(false)
        })
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, currentIndex, playlist])

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteracted && playlist.length > 0) {
        setHasInteracted(true)
        setIsPlaying(true)
      }
    }

    if (!hasInteracted) {
      document.addEventListener('click', handleFirstInteraction, { once: true })
      document.addEventListener('keydown', handleFirstInteraction, { once: true })
    }

    return () => {
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [hasInteracted, playlist.length])

  const handleNext = () => {
    if (playlist.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % playlist.length)
      setIsPlaying(true)
    }
  }

  const handlePrev = () => {
    if (playlist.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + playlist.length) % playlist.length)
      setIsPlaying(true)
    }
  }

  const togglePlay = () => {
    setHasInteracted(true)
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setProgress(time)
    }
  }

  const currentSong = playlist.length > 0 ? playlist[currentIndex] : null

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('music-status', {
        detail: { isPlaying, currentSong }
      }))
    }
  }, [isPlaying, currentSong])

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  if (playlist.length === 0) return null

  return (
    <div className="w-full mt-6">
      <div
        className="flex flex-col md:flex-row items-center gap-4 md:gap-6 px-4 md:px-6 py-4 rounded-xl shadow-2xl border w-full"
        style={{
          backgroundColor: '#161b22',
          borderColor: 'var(--terminal-border)',
          color: 'var(--terminal-highlight)'
        }}
      >
        {/* Song Title */}
        <div className="text-xs font-medium truncate w-full md:w-48 text-center md:text-right shrink-0 md:order-last">
          {currentSong}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-6 md:gap-4 shrink-0 w-full md:w-auto">
          <button aria-label="Previous track" onClick={handlePrev} className="hover:text-white transition-colors opacity-80 hover:opacity-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="19 20 9 12 19 4 19 20" />
              <rect x="5" y="4" width="2" height="16" />
            </svg>
          </button>

          <button
            aria-label={isPlaying ? "Pause track" : "Play track"}
            onClick={togglePlay}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors border shrink-0"
            style={{ borderColor: 'var(--terminal-border)' }}
          >
            {isPlaying ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          <button aria-label="Next track" onClick={handleNext} className="hover:text-white transition-colors opacity-80 hover:opacity-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 4 15 12 5 20 5 4" />
              <rect x="17" y="4" width="2" height="16" />
            </svg>
          </button>
        </div>

        {/* Progress Bar & Timestamps */}
        <div className="flex items-center gap-3 text-[10px] flex-1 w-full min-w-0" style={{ color: 'var(--terminal-muted)' }}>
          <span className="w-8 text-right shrink-0">{formatTime(progress)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={progress}
            onChange={handleSeek}
            className="flex-1 min-w-0 h-1 rounded-lg appearance-none cursor-pointer"
            style={{ backgroundColor: 'var(--terminal-border)' }}
          />
          <span className="w-8 text-left shrink-0">{formatTime(duration)}</span>
        </div>

        <audio
          ref={audioRef}
          src={`/music/${currentSong}`}
          onEnded={handleNext}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />
      </div>
    </div>
  )
}
