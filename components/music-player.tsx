'use client'

import { useEffect, useRef, useState } from 'react'

// Hidden player: nothing renders until someone types `play music` in the
// terminal (lib/terminal/commands.ts), which fires a `play-music` event.
// `stop music` (a `stop-music` event) or × pauses and hides it again.

const title = (file: string) => file.replace(/\.[^.]+$/, '')

function formatTime(t: number) {
  if (!Number.isFinite(t)) return '0:00'
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

export function MusicPlayer() {
  const [playlist, setPlaylist] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const autoplayRef = useRef(false)

  useEffect(() => {
    fetch('/api/music')
      .then((r) => (r.ok ? r.json() : { files: [] }))
      .then((d) => setPlaylist(Array.isArray(d.files) ? d.files : []))
      .catch(() => {})
  }, [])

  const play = () => audioRef.current?.play().catch(() => setPlaying(false))
  const pause = () => audioRef.current?.pause()

  useEffect(() => {
    const onPlay = () => {
      if (playlist.length === 0) return
      setVisible(true)
      play()
    }
    const onStop = () => {
      audioRef.current?.pause()
      setVisible(false)
    }
    window.addEventListener('play-music', onPlay)
    window.addEventListener('stop-music', onStop)
    return () => {
      window.removeEventListener('play-music', onPlay)
      window.removeEventListener('stop-music', onStop)
    }
  }, [playlist.length])

  // Keep playing when the track changes via next/prev/ended.
  useEffect(() => {
    if (autoplayRef.current) {
      autoplayRef.current = false
      play()
    }
  }, [index])

  const skip = (step: number) => {
    autoplayRef.current = true
    setProgress(0)
    setIndex((i) => (i + step + playlist.length) % playlist.length)
  }

  const close = () => {
    pause()
    setVisible(false)
  }

  if (playlist.length === 0) return null
  const current = playlist[index]

  return (
    <>
      <audio
        ref={audioRef}
        src={`/music/${encodeURIComponent(current)}`}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => skip(1)}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />
      {visible && (
        <div
          role="region"
          aria-label="Music player"
          className="fixed bottom-4 right-4 z-50 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface/95 p-3 font-mono text-xs text-ink shadow-2xl backdrop-blur"
        >
          <div className="flex items-center gap-2">
            <span className={`size-1.5 shrink-0 rounded-full ${playing ? 'bg-accent' : 'bg-ink-muted'}`} aria-hidden />
            <p className="min-w-0 flex-1 truncate text-ink-2" title={title(current)}>
              {title(current)}
            </p>
            <button onClick={close} aria-label="Close music player" className="shrink-0 px-1 text-ink-muted hover:text-ink">
              ×
            </button>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button onClick={() => skip(-1)} aria-label="Previous track" className="text-ink-muted hover:text-ink">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <polygon points="19 20 9 12 19 4 19 20" />
                <rect x="5" y="4" width="2" height="16" />
              </svg>
            </button>
            <button
              onClick={() => (playing ? pause() : play())}
              aria-label={playing ? 'Pause' : 'Play'}
              className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line-strong text-ink hover:border-accent hover:text-accent"
            >
              {playing ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5" aria-hidden>
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>
            <button onClick={() => skip(1)} aria-label="Next track" className="text-ink-muted hover:text-ink">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <polygon points="5 4 15 12 5 20 5 4" />
                <rect x="17" y="4" width="2" height="16" />
              </svg>
            </button>

            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={progress}
              onChange={(e) => {
                const t = Number(e.target.value)
                if (audioRef.current) audioRef.current.currentTime = t
                setProgress(t)
              }}
              aria-label="Seek"
              className="h-1 min-w-0 flex-1 cursor-pointer accent-[var(--accent)]"
            />
            <span className="shrink-0 tabular-nums text-ink-muted">
              {formatTime(progress)}/{formatTime(duration)}
            </span>
          </div>
        </div>
      )}
    </>
  )
}
