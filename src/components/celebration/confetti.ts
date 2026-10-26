import {
  CONFETTI_SPEEDS,
  clampConfettiPieces,
  clampConfettiShots,
  type ConfettiSpeed,
} from '@/lib/celebrations/shared'

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

/**
 * One trajectory for every speed: launch power scales with √(viewport height) so the strongest
 * pieces reach near the top. Speed only changes how fast time passes, so Slow follows the same
 * arcs as Lively, just in slow motion.
 */
const PHYSICS = { drag: 0.992, gravity: 0.06, life: 900, power: 0.6 }

const TIME_SCALE: Record<ConfettiSpeed, number> = {
  verySlow: 0.4,
  slow: 0.7,
  // Normal (the default) plays the splash in real time.
  medium: 1,
  lively: 1.4,
}

/** Cannons aim up and inward: 62° above the horizontal, give or take about 18°. */
const CANNON_ANGLE = (62 * Math.PI) / 180
const CANNON_SPREAD = 0.62

/** Bursts are spaced further apart at slower speeds so each splash has room to bloom. */
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

/** One burst: both bottom corners fire at once, so the splash meets in the middle of the window. */
const fireCannons = (
  width: number,
  height: number,
  power: number,
  piecesPerCannon: number,
  add: (p: Piece) => void,
) => {
  const maxVelocity = power * Math.sqrt(height)

  for (let i = 0; i < piecesPerCannon; i++) {
    // A wide range of launch speeds layers the splash from low to near the top.
    const velocity = maxVelocity * (0.55 + Math.random() * 0.45)
    const spread = (Math.random() - 0.5) * CANNON_SPREAD
    add(piece(-4, height + 4, -CANNON_ANGLE + spread, velocity))
    add(piece(width + 4, height + 4, -Math.PI + CANNON_ANGLE + spread, velocity))
  }
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Fires `shots` waves of full-window confetti. Returns a function that stops it early.
 * Does nothing when the visitor prefers reduced motion or canvas is unavailable.
 */
export function launchConfetti({
  pieces,
  shots,
  speed,
}: {
  /** Pieces fired from each bottom corner per burst. */
  pieces: number
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

  // Settings can come from data cached by an older release, so missing values fall back safely.
  const dt = TIME_SCALE[CONFETTI_SPEEDS.includes(speed) ? speed : 'medium']
  const piecesPerCannon = clampConfettiPieces(pieces)
  const bursts = clampConfettiShots(shots)
  const life = PHYSICS.life / dt
  const drag = Math.pow(PHYSICS.drag, dt)
  let live: Piece[] = []
  let frame = 0
  let pendingWaves = bursts
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
    live = live.filter((p) => p.age < life && p.y < height + 40)

    for (const p of live) {
      p.age += 1
      p.vy += PHYSICS.gravity * dt
      p.vx *= drag
      p.vy *= drag
      p.sway += 0.02 * dt
      p.x += (p.vx + Math.sin(p.sway) * p.swayAmp) * dt
      p.y += p.vy * dt
      p.rot += p.spin * dt
      p.flip += p.flipSpeed * dt

      context.save()
      context.translate(p.x, p.y)
      context.rotate(p.rot)
      context.globalAlpha = Math.min(1, (life - p.age) / (60 / dt))
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

    if (live.length > 0 || pendingWaves > 0) frame = window.requestAnimationFrame(draw)
    else stop()
  }

  for (let index = 0; index < bursts; index++) {
    timers.push(
      window.setTimeout(
        () => {
          fireCannons(window.innerWidth, window.innerHeight, PHYSICS.power, piecesPerCannon, (p) =>
            live.push(p),
          )
          pendingWaves -= 1
        },
        (index * WAVE_INTERVAL_MS) / Math.sqrt(dt),
      ),
    )
  }
  frame = window.requestAnimationFrame(draw)

  return stop
}
