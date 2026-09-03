export type OklchColor = {
  chroma: number
  hue: number
  lightness: number
}

const clamp = (value: number) => Math.min(1, Math.max(0, value))

export const parseOklch = (value: string): OklchColor => {
  const match = value.match(
    /^oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*\)$/i,
  )

  if (!match) {
    throw new Error(`Expected an opaque OKLCH color, received: ${value}`)
  }

  const rawLightness = Number(match[1])

  return {
    lightness: value.includes('%') ? rawLightness / 100 : rawLightness,
    chroma: Number(match[2]),
    hue: Number(match[3]),
  }
}

export const relativeLuminance = ({ lightness, chroma, hue }: OklchColor) => {
  const hueRadians = (hue * Math.PI) / 180
  const a = chroma * Math.cos(hueRadians)
  const b = chroma * Math.sin(hueRadians)

  const lPrime = lightness + 0.3963377774 * a + 0.2158037573 * b
  const mPrime = lightness - 0.1055613458 * a - 0.0638541728 * b
  const sPrime = lightness - 0.0894841775 * a - 1.291485548 * b

  const l = lPrime ** 3
  const m = mPrime ** 3
  const s = sPrime ** 3

  const red = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)
  const green = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)
  const blue = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export const contrastRatio = (first: OklchColor, second: OklchColor) => {
  const firstLuminance = relativeLuminance(first)
  const secondLuminance = relativeLuminance(second)
  const lighter = Math.max(firstLuminance, secondLuminance)
  const darker = Math.min(firstLuminance, secondLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}
