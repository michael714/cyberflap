import { CHAR, COLOR_HEX } from '../utils/characters'

export const RAINBOW_STORAGE_KEY = 'cyberflap.rainbowMode'
export const DEFAULT_RAINBOW_MODE = true

/** Fixed rainbow order: row index → color for the full 6-row case. */
export const RAINBOW_ROW_COLORS = [
  COLOR_HEX[CHAR.RED],
  COLOR_HEX[CHAR.ORANGE],
  COLOR_HEX[CHAR.YELLOW],
  COLOR_HEX[CHAR.GREEN],
  COLOR_HEX[CHAR.BLUE],
  COLOR_HEX[CHAR.VIOLET],
]

const RAINBOW_COLOR_META = [
  { name: 'red', hex: COLOR_HEX[CHAR.RED] },
  { name: 'orange', hex: COLOR_HEX[CHAR.ORANGE] },
  { name: 'yellow', hex: COLOR_HEX[CHAR.YELLOW] },
  { name: 'green', hex: COLOR_HEX[CHAR.GREEN] },
  { name: 'blue', hex: COLOR_HEX[CHAR.BLUE] },
  { name: 'violet', hex: COLOR_HEX[CHAR.VIOLET] },
]

const listeners = new Set()

function readStoredRainbowMode() {
  if (typeof window === 'undefined') return DEFAULT_RAINBOW_MODE
  try {
    const stored = window.localStorage.getItem(RAINBOW_STORAGE_KEY)
    if (stored === null) return DEFAULT_RAINBOW_MODE
    return stored === 'true'
  } catch {
    return DEFAULT_RAINBOW_MODE
  }
}

let rainbowMode = readStoredRainbowMode()

export function getRainbowMode() {
  return rainbowMode
}

export function setRainbowMode(enabled) {
  rainbowMode = Boolean(enabled)
  try {
    window.localStorage.setItem(RAINBOW_STORAGE_KEY, String(rainbowMode))
  } catch {
    // Persist best-effort; in-memory value still updates.
  }
  for (const listener of listeners) {
    listener(rainbowMode)
  }
  return rainbowMode
}

export function subscribeRainbowMode(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function parseHex(hex) {
  const raw = hex.replace('#', '')
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : raw
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  }
}

function channelLuminance(channel) {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance for an #RRGGBB background. */
export function relativeLuminance(hex) {
  const { r, g, b } = parseHex(hex)
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  )
}

function contrastRatio(luminanceA, luminanceB) {
  const lighter = Math.max(luminanceA, luminanceB)
  const darker = Math.min(luminanceA, luminanceB)
  return (lighter + 0.05) / (darker + 0.05)
}

/** Pick black or white ink for better contrast on a background. */
export function contrastingInk(backgroundHex) {
  const background = relativeLuminance(backgroundHex)
  const blackContrast = contrastRatio(background, 0)
  const whiteContrast = contrastRatio(background, 1)
  return blackContrast >= whiteContrast ? '#111111' : '#FFFFFF'
}

const BLACK_INK = '#111111'
const WHITE_INK = '#FFFFFF'

/**
 * Contrast-based groups (verified against WCAG black/white ratios):
 * - dark (white text): red, violet
 * - light (black text): orange, yellow, green, blue
 */
export function getRainbowInkGroups() {
  const dark = []
  const light = []
  for (const color of RAINBOW_COLOR_META) {
    const ink = contrastingInk(color.hex)
    if (ink === WHITE_INK) dark.push(color)
    else light.push(color)
  }
  return { dark, light }
}

/** Evenly space `count` picks across `items` (spectral order preserved). */
export function pickMaximallyDistinct(items, count) {
  if (count <= 0) return []
  if (count >= items.length) return items.slice()
  if (count === 1) return [items[0]]

  const picked = []
  for (let i = 0; i < count; i++) {
    const index = Math.round((i * (items.length - 1)) / (count - 1))
    picked.push(items[index])
  }
  return picked
}

function blackContrast(hex) {
  return contrastRatio(relativeLuminance(hex), 0)
}

function whiteContrast(hex) {
  return contrastRatio(relativeLuminance(hex), 1)
}

/**
 * Palette for an N-row board. 6 rows = full mixed rainbow.
 * 2–5 rows = colors from a single ink group so text color stays consistent.
 */
export function getRainbowPalette(rowCount) {
  if (rowCount < 2) return null

  if (rowCount >= 6) {
    return RAINBOW_ROW_COLORS.map((background) => ({
      background,
      foreground: contrastingInk(background),
    }))
  }

  const { dark, light } = getRainbowInkGroups()
  let pool = null
  let ink = null

  if (light.length >= rowCount) {
    pool = light
    ink = BLACK_INK
  } else if (dark.length >= rowCount) {
    pool = dark
    ink = WHITE_INK
  } else if (light.length >= dark.length) {
    // e.g. 5 rows: light has 4 — extend with the best remaining color for black ink.
    ink = BLACK_INK
    const extras = dark
      .slice()
      .sort((a, b) => blackContrast(b.hex) - blackContrast(a.hex))
    pool = [...light, ...extras].slice(0, rowCount)
  } else {
    ink = WHITE_INK
    const extras = light
      .slice()
      .sort((a, b) => whiteContrast(b.hex) - whiteContrast(a.hex))
    pool = [...dark, ...extras].slice(0, rowCount)
  }

  // Keep spectral order from the master rainbow list.
  const order = new Map(RAINBOW_COLOR_META.map((color, index) => [color.hex, index]))
  pool = pool.slice().sort((a, b) => order.get(a.hex) - order.get(b.hex))

  return pickMaximallyDistinct(pool, rowCount).map((color) => ({
    background: color.hex,
    foreground: ink,
  }))
}

/**
 * Row theme when rainbow mode is active on multi-row boards.
 * @returns {{ background: string, foreground: string } | null}
 */
export function getRowTheme(rowIndex, { rainbowMode: enabled, rowCount }) {
  if (!enabled || rowCount < 2) return null
  const palette = getRainbowPalette(rowCount)
  if (!palette) return null
  return palette[rowIndex] ?? palette[0]
}
