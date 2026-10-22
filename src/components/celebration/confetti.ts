import type { ConfettiSpeed } from '@/lib/celebrations/shared'

const COLORS = [
  '#e3b552',
  '#f6e3b4',
  '#9bd4a0',
  '#2f7a43',
  '#8fb3ff',
  '#ffffff',
  '#c9a7ff',
  '#11275a',
]

/** Gravity, air drag, and lifetime (frames) per speed; slow pieces drift and flutter longest. */
const SPEEDS: Record<ConfettiSpeed, { drag: number; gravity: number; life: number }> = {
  slow: { drag: 0.992, gravity: 0.06, life: 900 },
  medium: { drag: 0.988, gravity: 0.1, life: 650 },
  lively: { drag: 0.984, gravity: 0.16, life: 460 },
}

const WAVE_INTERVAL_MS = 1400

type Piece = {
  age: number
  color: string
  flip: number
  flipSpeed: number
  rot: number
  shape: 'dot' | 'flake' | 'ribbon'
  size: number
  spin: number
  sway: number
  swayAmp: number
  vx: number
  vy: number
  x: number
  y: number
}

const piece = (x: number, y: number, angle: number, velocity: number): Piece => ({
  age: 0,
  color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
  flip: Math.random() * Math.PI * 2,
  flipSpeed: 0.03 + Math.random() * 0.05,
  rot: Math.random() * Math.PI * 2,
  shape: Math.random() < 0.18 ? 'dot' : Math.random() < 0.35 ? 'ribbon' : 'flake',
  size: 6 + Math.random() * 8,
  spin: (Math.random() - 0.5) * 0.12,
  sway: Math.random() * Math.PI * 2,
  swayAmp: 0.4 + Math.random() * 0.9,
  vx: Math.cos(angle) * velocity,
  vy: Math.sin(angle) * velocity,
  x,
  y,
})

/** Each wave fires from a different place so the whole window fills over the celebration. */
const waves: Array<(w: number, h: number, add: (p: Piece) => void) => void> = [
  (w, h, add) => {
    for (let i = 0; i < 70; i++) {
      add(piece(0, h, -Math.PI / 2.9 + (Math.random() - 0.5) * 0.6, 9 + Math.random() * 6))
      add(
        piece(w, h, -Math.PI + Math.PI / 2.9 + (Math.random() - 0.5) * 0.6, 9 + Math.random() * 6),
      )
    }
  },
  (w, _h, add) => {
    for (let i = 0; i < 140; i++)
      add(
        piece(
          Math.random() * w,
          -20 - Math.random() * 120,
          Math.PI / 2 + (Math.random() - 0.5) * 0.5,
          1 + Math.random() * 2,
        ),
      )
  },
  (_w, h, add) => {
    for (let i = 0; i < 90; i++)
      add(
        piece(
          -10,
          h * (0.2 + Math.random() * 0.5),
          -0.4 + (Math.random() - 0.5) * 0.5,
          7 + Math.random() * 5,
        ),
      )
  },
  (w, h, add) => {
    for (let i = 0; i < 90; i++)
      add(
        piece(
          w + 10,
          h * (0.2 + Math.random() * 0.5),
          Math.PI + 0.4 + (Math.random() - 0.5) * 0.5,
          7 + Math.random() * 5,
        ),
      )
  },
  (w, h, add) => {
    for (let i = 0; i < 120; i++)
      add(piece(w / 2, h * 0.45, Math.random() * Math.PI * 2, 3 + Math.random() * 6))
  },
]

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Fires `shots` waves of full-window confetti. Returns a function that stops it early.
 * Does nothing when the visitor prefers reduced motion or canvas is unavailable.
 */
export function launchConfetti({
  shots,
  speed,
}: {
  shots: number
  speed: ConfettiSpeed
}): () => void {
  if (typeof document === 'undefined' || prefersReducedMotion()) return () => {}

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return () => {}

  canvas.setAttribute('aria-hidden', 'true')
  canvas.dataset.celebrationConfetti = 'true'
  Object.assign(canvas.style, {
    height: '100vh',
    inset: '0',
    pointerEvents: 'none',
    position: 'fixed',
    width: '100vw',
    zIndex: '1001',
  })
  document.body.appendChild(canvas)

  const settings = SPEEDS[speed]
  let pieces: Piece[] = []
  let frame = 0
  let pendingWaves = shots
  let stopped = false
  const timers: number[] = []

  const resize = () => {
    const ratio = window.devicePixelRatio || 1
    canvas.width = window.innerWidth * ratio
    canvas.height = window.innerHeight * ratio
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
  }
  resize()
  window.addEventListener('resize', resize)

  const stop = () => {
    if (stopped) return
    stopped = true
    timers.forEach((id) => window.clearTimeout(id))
    window.cancelAnimationFrame(frame)
    window.removeEventListener('resize', resize)
    canvas.remove()
  }

  const draw = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    context.clearRect(0, 0, width, height)
    pieces = pieces.filter((p) => p.age < settings.life && p.y < height + 40)

    for (const p of pieces) {
      p.age += 1
      p.vy += settings.gravity
      p.vx *= settings.drag
      p.vy *= settings.drag
      p.sway += 0.02
      p.x += p.vx + Math.sin(p.sway) * p.swayAmp
      p.y += p.vy
      p.rot += p.spin
      p.flip += p.flipSpeed

      context.save()
      context.translate(p.x, p.y)
      context.rotate(p.rot)
      context.globalAlpha = Math.min(1, (settings.life - p.age) / 60)
      context.fillStyle = p.color
      if (p.shape === 'dot') {
        context.beginPath()
        context.arc(0, 0, p.size / 3, 0, Math.PI * 2)
        context.fill()
      } else if (p.shape === 'ribbon') {
        context.scale(1, Math.cos(p.flip))
        context.fillRect(-p.size, -1.5, p.size * 2, 3)
      } else {
        context.scale(Math.cos(p.flip), 1)
        context.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66)
      }
      context.restore()
    }

    if (pieces.length > 0 || pendingWaves > 0) frame = window.requestAnimationFrame(draw)
    else stop()
  }

  for (let index = 0; index < shots; index++) {
    timers.push(
      window.setTimeout(() => {
        waves[index % waves.length]!(window.innerWidth, window.innerHeight, (p) => pieces.push(p))
        pendingWaves -= 1
      }, index * WAVE_INTERVAL_MS),
    )
  }
  frame = window.requestAnimationFrame(draw)

  return stop
}
