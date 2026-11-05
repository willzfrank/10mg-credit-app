const LIGHT = '#ffffff'
const DARK = '#0a0a0a'

export const WCAG_TEXT_CONTRAST = 4.5

function toRgb(hex: string): [number, number, number] {
  let digits = hex.replace('#', '')
  if (digits.length === 3) digits = [...digits].map((c) => c + c).join('')
  const value = parseInt(digits, 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

export function getReadableForeground(background: string): string {
  return contrastRatio(background, LIGHT) >= contrastRatio(background, DARK) ? LIGHT : DARK
}
