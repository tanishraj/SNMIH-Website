/** The cone artwork and particles share these mouth coordinates in viewport pixels. */
export const getConfettiConeGeometry = (width: number, height: number) => {
  const size = Math.min(88, Math.max(48, width * 0.07))
  const inset = width < 640 ? 12 : 24
  const x = inset + size * 0.55
  const y = height - inset - size * 0.82
  return { left: { x, y }, right: { x: width - x, y }, scale: size / 100 }
}

/** Gold-rimmed navy party cones, tilted to match the 62-degree confetti trajectory. */
export function drawConfettiCones(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const { left, right, scale } = getConfettiConeGeometry(width, height)
  for (const [mouth, direction] of [
    [left, 1],
    [right, -1],
  ] as const) {
    context.save()
    context.translate(mouth.x, mouth.y)
    context.scale(scale * direction, scale)
    context.rotate((28 * Math.PI) / 180)

    // Tapered paper cone with warm foil bands, drawn in local coordinates below the mouth.
    const paper = context.createLinearGradient(-25, 0, 25, 0)
    paper.addColorStop(0, '#081634')
    paper.addColorStop(0.55, '#24477d')
    paper.addColorStop(1, '#11275a')
    context.beginPath()
    context.moveTo(-25, 0)
    context.lineTo(0, 90)
    context.lineTo(25, 0)
    context.closePath()
    context.fillStyle = paper
    context.fill()
    context.save()
    context.clip()
    context.strokeStyle = '#e3b552'
    context.lineWidth = 9
    for (const y of [18, 44, 70]) {
      context.beginPath()
      context.moveTo(-30, y - 12)
      context.lineTo(30, y + 12)
      context.stroke()
    }
    context.strokeStyle = 'rgba(255,255,255,0.3)'
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(13, 0)
    context.lineTo(0, 83)
    context.stroke()
    context.restore()

    // A dark, open mouth makes the origin of every burst legible.
    context.beginPath()
    context.ellipse(0, 0, 25, 8, 0, 0, Math.PI * 2)
    context.fillStyle = '#081634'
    context.fill()
    context.strokeStyle = '#f6e3b4'
    context.lineWidth = 3
    context.stroke()
    context.restore()
  }
}
