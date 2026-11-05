'use client'

import { useEffect, useRef, useState } from 'react'

// Portrait ↔ text on a fixed grid of digits (the cursor pushes them aside). When the scene changes, the old
// digits are replaced one by one, in a direction that changes each time, by the next scene,
// revealed only where the old one has gone. The panel is always dark, so colors are fixed rather than theme tokens.
const INK = '#e6edf3'
const ACCENT = '#3ef08a'
const GLYPHS = '0123456789' // index 0/1 doubles as the settled bit
const SPRITE = 64
const GLYPH_SCALE = 1.6 // sprite cell is larger than the glyph to leave room for glow

const DEFAULT_WORDS = [
  ['DEVENDRA', 'HAMAL'],
  ['SOFTWARE', 'ENGINEER'],
  ['WEB', 'DEVELOPER'],
  ['FULL', 'STACK'],
  ['LARAVEL', 'NEXT.JS'],
  ['SYSTEMS', 'THAT', 'STAY UP'],
  ['BASED IN', 'KATHMANDU'],
]
const HOLD_PORTRAIT = 2.2
const HOLD_TEXT = 1.5

// Scene change: old digits are replaced one by one (see ORDERS) over SWAP seconds; each replaced
// cell shows the next scene dimmed (REPLACED), then everything brightens over BRIGHTEN.
const SWAP = 0.6

// Replacement orders, used in turn: map a cell (x, y) on an n×n grid to its place in line.
const ORDERS: ((x: number, y: number, n: number) => number)[] = [
  (x, y, n) => y * n + x, // rows from the top, left → right
  (x, y, n) => x * n + y, // columns from the left, top → bottom
  (x, y, n) => (n - 1 - y) * n + (n - 1 - x), // rows from the bottom, right → left
  (x, y, n) => (n - 1 - x) * n + (n - 1 - y), // columns from the right, bottom → top
]
const BRIGHTEN = 0.25
const REPLACED = 0.45

// Per-cell brightness (alpha) and glyph size for one scene.
type Scene = { a: Float32Array; s: Float32Array }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function makeCanvas(size: number) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  return c
}

// Halve repeatedly so the downscale averages the digit texture instead of aliasing it.
function downscale(img: HTMLImageElement, size: number) {
  let src: CanvasImageSource = img
  let w = img.naturalWidth
  while (w / 2 > size * 1.5) {
    w = Math.round(w / 2)
    const step = makeCanvas(w)
    step.getContext('2d')!.drawImage(src, 0, 0, w, w)
    src = step
  }
  const out = makeCanvas(size)
  const ctx = out.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src, 0, 0, size, size)
  return ctx.getImageData(0, 0, size, size).data
}

// Faint background digits, like the original photo's backdrop.
function dust(scene: Scene, cell: number) {
  for (let i = 0; i < scene.a.length; i++) {
    if (scene.a[i] === 0 && Math.random() < 0.12) {
      scene.a[i] = 0.04 + Math.random() * 0.08
      scene.s[i] = cell * (0.7 + Math.random() * 0.2)
    }
  }
  return scene
}

function samplePortrait(img: HTMLImageElement, cols: number, cell: number): Scene {
  const d = downscale(img, cols)
  const a = new Float32Array(cols * cols)
  const s = new Float32Array(cols * cols)
  for (let i = 0; i < a.length; i++) {
    const l = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255
    const v = clamp((l - 0.12) / 0.6, 0, 1)
    if (v < 0.06) continue
    a[i] = 0.18 + 0.82 * Math.pow(v, 0.85)
    s[i] = cell * (0.85 + 0.35 * v)
  }
  return dust({ a, s }, cell)
}

function sampleText(lines: string[], cols: number, cell: number, family: string): Scene {
  const c = makeCanvas(cols)
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `800 100px ${family}`
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width))
  const lh = 1.1
  const fs = Math.min((100 * cols * 0.9) / widest, (cols * 0.62) / (lines.length * lh))
  ctx.font = `800 ${fs}px ${family}`
  const top = cols * 0.47 - ((lines.length - 1) * fs * lh) / 2
  lines.forEach((l, i) => ctx.fillText(l, cols / 2, top + i * fs * lh))
  const d = ctx.getImageData(0, 0, cols, cols).data
  const a = new Float32Array(cols * cols)
  const s = new Float32Array(cols * cols)
  for (let i = 0; i < a.length; i++) {
    const alpha = d[i * 4 + 3]
    if (alpha < 110) continue
    a[i] = 0.8 + (0.2 * alpha) / 255
    s[i] = cell * 1.2
  }
  return dust({ a, s }, cell)
}

function buildSprites(family: string) {
  const c = document.createElement('canvas')
  c.width = SPRITE * GLYPHS.length
  c.height = SPRITE * 2
  const ctx = c.getContext('2d')!
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 ${SPRITE / GLYPH_SCALE}px ${family}`
  ;[INK, ACCENT].forEach((color, row) => {
    ctx.fillStyle = color
    ctx.shadowColor = row ? ACCENT : 'transparent'
    ctx.shadowBlur = row ? SPRITE * 0.18 : 0
    for (let g = 0; g < GLYPHS.length; g++) {
      ctx.fillText(GLYPHS[g], g * SPRITE + SPRITE / 2, row * SPRITE + SPRITE / 2 + 2)
    }
  })
  return c
}

export function PortraitMorph({
  src,
  alt,
  words = DEFAULT_WORDS,
}: {
  src: string
  alt: string
  words?: string[][]
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [enabled, setEnabled] = useState(false)
  const wordsKey = JSON.stringify(words)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext('2d')!
    const lines: string[][] = JSON.parse(wordsKey)
    // Scene 0 is the portrait, shown once per loop; 1..n are the phrases in order.
    const sequence = [0, ...lines.map((_, i) => i + 1)]

    let cancelled = false
    let raf = 0
    let running = false
    let last = 0
    let W = 0
    let cols = 0
    let cell = 0
    let sprites: HTMLCanvasElement | null = null
    let family = 'monospace'
    let img: HTMLImageElement | null = null
    let scenes: Scene[] = []
    let step = 0
    let orderStep = Math.floor(Math.random() * ORDERS.length)
    let phase: 'hold' | 'swap' | 'brighten' = 'hold'
    let holdLeft = HOLD_TEXT
    let t = 0

    // Per-cell state.
    let a = new Float32Array(0) // current alpha
    let s = new Float32Array(0) // current size
    let fromA = new Float32Array(0) // outgoing scene, snapshotted at swap start
    let fromS = new Float32Array(0)
    let delay = new Float32Array(0)
    let done = new Uint8Array(0) // 1 once a cell has been replaced
    let flash = new Float32Array(0)
    // Cursor push: per-cell offset and velocity, springing back to the grid spot.
    let ox = new Float32Array(0)
    let oy = new Float32Array(0)
    let vx = new Float32Array(0)
    let vy = new Float32Array(0)
    let mx = -1e4
    let my = -1e4
    let glyph = new Uint8Array(0)
    let bit = new Uint8Array(0)

    const build = () => {
      if (!img || !sprites) return
      W = wrap.getBoundingClientRect().width
      if (W < 10) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(W * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      cols = clamp(Math.round(W / 5), 56, 110)
      cell = W / cols
      scenes = [samplePortrait(img, cols, cell), ...lines.map((l) => sampleText(l, cols, cell, family))]

      const n = cols * cols
      fromA = new Float32Array(n)
      fromS = new Float32Array(n)
      delay = new Float32Array(n)
      done = new Uint8Array(n)
      flash = new Float32Array(n)
      ox = new Float32Array(n)
      oy = new Float32Array(n)
      vx = new Float32Array(n)
      vy = new Float32Array(n)
      bit = Uint8Array.from({ length: n }, () => (Math.random() < 0.5 ? 0 : 1))
      glyph = bit.slice()

      // Start somewhere random in the cycle on every load.
      step = Math.floor(Math.random() * sequence.length)
      const scene = scenes[sequence[step]]
      a = scene.a.slice()
      s = scene.s.slice()
      phase = 'hold'
      holdLeft = sequence[step] === 0 ? HOLD_PORTRAIT : HOLD_TEXT
    }

    const startSwap = () => {
      step = (step + 1) % sequence.length
      fromA.set(a)
      fromS.set(s)
      // Replace digits one after another, in the next direction of the cycle, spreading SWAP
      // over only the cells that have a digit in either scene.
      const next = scenes[sequence[step]]
      const order = ORDERS[orderStep++ % ORDERS.length]
      const cells: number[] = []
      for (let i = 0; i < a.length; i++) {
        delay[i] = 0
        if (a[i] >= 0.01 || next.a[i] >= 0.01) cells.push(i)
      }
      const key = (i: number) => order(i % cols, Math.floor(i / cols), cols)
      cells.sort((x, y) => key(x) - key(y))
      cells.forEach((i, rank) => (delay[i] = (rank / cells.length) * SWAP))
      done.fill(0)
      phase = 'swap'
      t = 0
    }

    const update = (dt: number) => {
      const next = scenes[sequence[step]]
      if (phase === 'hold') {
        holdLeft -= dt
        if (holdLeft <= 0) startSwap()
      } else if (phase === 'swap') {
        // Each cell shows the old scene until its turn, then the next scene (dimmed), so the
        // next scene is revealed only where the old one has gone.
        t += dt
        for (let i = 0; i < a.length; i++) {
          if (!done[i] && t >= delay[i]) {
            done[i] = 1
            bit[i] = Math.random() < 0.5 ? 0 : 1
            glyph[i] = bit[i]
          }
          if (done[i]) {
            a[i] = next.a[i] * REPLACED
            s[i] = next.s[i]
          } else {
            a[i] = fromA[i]
            s[i] = fromS[i]
          }
        }
        if (t >= SWAP) {
          phase = 'brighten'
          t = 0
        }
      } else {
        t += dt
        const e = Math.min(1, t / BRIGHTEN)
        const k = REPLACED + (1 - REPLACED) * e * (2 - e)
        for (let i = 0; i < a.length; i++) a[i] = next.a[i] * k
        if (e >= 1) {
          phase = 'hold'
          holdLeft = sequence[step] === 0 ? HOLD_PORTRAIT : HOLD_TEXT
        }
      }

      for (let i = 0; i < flash.length; i++) {
        if (flash[i] > 0.01) flash[i] *= Math.exp(-dt * 6)
        else flash[i] = 0
      }

      // Cursor repulsion with a spring back to rest.
      const R = W * 0.14
      const R2 = R * R
      const k = 70
      const damp = Math.exp(-dt * 9)
      for (let i = 0; i < a.length; i++) {
        if (a[i] < 0.01) continue
        const ddx = ((i % cols) + 0.5) * cell + ox[i] - mx
        const ddy = (Math.floor(i / cols) + 0.5) * cell + oy[i] - my
        const d2 = ddx * ddx + ddy * ddy
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 1
          const f = (1 - d / R) * W * 9 * dt
          vx[i] += (ddx / d) * f
          vy[i] += (ddy / d) * f
        }
        if (ox[i] || oy[i] || vx[i] || vy[i]) {
          vx[i] = (vx[i] - ox[i] * k * dt) * damp
          vy[i] = (vy[i] - oy[i] * k * dt) * damp
          ox[i] += vx[i] * dt
          oy[i] += vy[i] * dt
          if (Math.abs(ox[i]) + Math.abs(oy[i]) + Math.abs(vx[i]) + Math.abs(vy[i]) < 0.01) ox[i] = oy[i] = vx[i] = vy[i] = 0
        }
      }

      // Idle flicker: a few digits flip, some with a faint green blip.
      if (phase === 'hold') {
        const rate = a.length * dt * 0.03
        const flips = Math.floor(rate) + (Math.random() < rate % 1 ? 1 : 0)
        for (let k = 0; k < flips; k++) {
          const i = Math.floor(Math.random() * a.length)
          if (a[i] < 0.01) continue
          bit[i] ^= 1
          glyph[i] = bit[i]
          if (Math.random() < 0.25) flash[i] = Math.max(flash[i], 0.5)
        }
      }
    }

    const draw = () => {
      if (!sprites) return
      ctx.clearRect(0, 0, W, W)
      for (let i = 0; i < a.length; i++) {
        if (a[i] < 0.01) continue
        // Pushed digits glow green and a little brighter.
        const push = Math.min(1, (Math.abs(ox[i]) + Math.abs(oy[i])) / (W * 0.04))
        const m = Math.min(1, flash[i] * 0.9 + push * 0.8)
        const alpha = Math.min(1, a[i] + push * 0.3)
        const size = s[i] * GLYPH_SCALE
        const x = ((i % cols) + 0.5) * cell + ox[i] - size / 2
        const y = (Math.floor(i / cols) + 0.5) * cell + oy[i] - size / 2
        const sx = glyph[i] * SPRITE
        if (m < 0.98) {
          ctx.globalAlpha = alpha * (1 - m)
          ctx.drawImage(sprites, sx, 0, SPRITE, SPRITE, x, y, size, size)
        }
        if (m > 0.02) {
          ctx.globalAlpha = alpha * m
          ctx.drawImage(sprites, sx, SPRITE, SPRITE, SPRITE, x, y, size, size)
        }
      }
      ctx.globalAlpha = 1
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      update(dt)
      draw()
      raf = requestAnimationFrame(tick)
    }

    const start = () => {
      if (running || cancelled || !a.length) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      mx = e.clientX - r.left
      my = e.clientY - r.top
    }
    const onLeave = () => {
      mx = my = -1e4
    }
    const onClick = () => {
      if (phase === 'hold') holdLeft = 0
    }
    wrap.addEventListener('pointermove', onMove)
    wrap.addEventListener('pointerleave', onLeave)
    wrap.addEventListener('click', onClick)

    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { threshold: 0.05 })
    let resizeTimer = 0
    let lastW = 0
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        const w = wrap.getBoundingClientRect().width
        if (Math.abs(w - lastW) < 2) return
        lastW = w
        build()
      }, 150)
    })

    ;(async () => {
      const el = new Image()
      el.src = src
      await Promise.all([el.decode(), document.fonts.ready]).catch(() => {})
      if (cancelled || !el.naturalWidth) return
      img = el
      family = getComputedStyle(canvas).fontFamily || 'monospace'
      sprites = buildSprites(family)
      lastW = wrap.getBoundingClientRect().width
      build()
      draw()
      setEnabled(true)
      io.observe(wrap)
      ro.observe(wrap)
    })()

    return () => {
      cancelled = true
      stop()
      io.disconnect()
      ro.disconnect()
      window.clearTimeout(resizeTimer)
      wrap.removeEventListener('pointermove', onMove)
      wrap.removeEventListener('pointerleave', onLeave)
      wrap.removeEventListener('click', onClick)
    }
  }, [src, wordsKey])

  return (
    <div ref={wrapRef} className={`absolute inset-0 ${enabled ? 'cursor-pointer' : ''}`}>
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full font-mono" />
      {/* Kept for alt text and as the reduced-motion fallback; the digit canvas replaces it otherwise. */}
      <img
        src={src}
        alt={alt}
        width={600}
        height={600}
        decoding="async"
        className="pointer-events-none absolute inset-0 h-full w-full object-contain object-bottom motion-safe:opacity-0"
      />
    </div>
  )
}
