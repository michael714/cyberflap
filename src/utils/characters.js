/** CyberFlap tile codes for every character and color chip the board can show. */

export const MAX_ROWS = 6
/** @deprecated Prefer MAX_ROWS — kept as an alias for the 6-row cap. */
export const ROWS = MAX_ROWS
export const COLS = 22
export const TILE_COUNT = MAX_ROWS * COLS

/** Board frame height transition when the active row count changes. */
export const BOARD_RESIZE_MS = 260

/** Duration of one character/color step on the flap wheel (ms). */
export const FLIP_STEP_MS = 72

/** Named codes for easy lookups: CHAR.A, CHAR.RED, etc. */
export const CHAR = {
  BLANK: 0,

  A: 1,
  B: 2,
  C: 3,
  D: 4,
  E: 5,
  F: 6,
  G: 7,
  H: 8,
  I: 9,
  J: 10,
  K: 11,
  L: 12,
  M: 13,
  N: 14,
  O: 15,
  P: 16,
  Q: 17,
  R: 18,
  S: 19,
  T: 20,
  U: 21,
  V: 22,
  W: 23,
  X: 24,
  Y: 25,
  Z: 26,

  ONE: 27,
  TWO: 28,
  THREE: 29,
  FOUR: 30,
  FIVE: 31,
  SIX: 32,
  SEVEN: 33,
  EIGHT: 34,
  NINE: 35,
  ZERO: 36,

  EXCLAMATION: 37,
  AT: 38,
  POUND: 39,
  DOLLAR: 40,
  LEFT_PAREN: 41,
  RIGHT_PAREN: 42,
  HYPHEN: 44,
  PLUS: 46,
  AMPERSAND: 47,
  EQUAL: 48,
  SEMICOLON: 49,
  COLON: 50,
  SINGLE_QUOTE: 52,
  DOUBLE_QUOTE: 53,
  PERCENT: 54,
  COMMA: 55,
  PERIOD: 56,
  SLASH: 59,
  QUESTION: 60,

  RED: 63,
  ORANGE: 64,
  YELLOW: 65,
  GREEN: 66,
  BLUE: 67,
  VIOLET: 68,
  WHITE: 69,
  BLACK: 70,
}

/** Solid color-tile palettes. */
export const COLOR_HEX = {
  [CHAR.RED]: '#DA291C',
  [CHAR.ORANGE]: '#FA4616',
  [CHAR.YELLOW]: '#FFD100',
  [CHAR.GREEN]: '#00B140',
  [CHAR.BLUE]: '#00A3E0',
  [CHAR.VIOLET]: '#702F8A',
  [CHAR.WHITE]: '#EDEBE4',
  [CHAR.BLACK]: '#1C1C1C',
}

const COLOR_NAMES = {
  red: CHAR.RED,
  orange: CHAR.ORANGE,
  yellow: CHAR.YELLOW,
  green: CHAR.GREEN,
  blue: CHAR.BLUE,
  violet: CHAR.VIOLET,
  white: CHAR.WHITE,
  black: CHAR.BLACK,
}

const CHAR_TO_CODE = {
  ' ': CHAR.BLANK,
  A: CHAR.A,
  B: CHAR.B,
  C: CHAR.C,
  D: CHAR.D,
  E: CHAR.E,
  F: CHAR.F,
  G: CHAR.G,
  H: CHAR.H,
  I: CHAR.I,
  J: CHAR.J,
  K: CHAR.K,
  L: CHAR.L,
  M: CHAR.M,
  N: CHAR.N,
  O: CHAR.O,
  P: CHAR.P,
  Q: CHAR.Q,
  R: CHAR.R,
  S: CHAR.S,
  T: CHAR.T,
  U: CHAR.U,
  V: CHAR.V,
  W: CHAR.W,
  X: CHAR.X,
  Y: CHAR.Y,
  Z: CHAR.Z,
  '0': CHAR.ZERO,
  '1': CHAR.ONE,
  '2': CHAR.TWO,
  '3': CHAR.THREE,
  '4': CHAR.FOUR,
  '5': CHAR.FIVE,
  '6': CHAR.SIX,
  '7': CHAR.SEVEN,
  '8': CHAR.EIGHT,
  '9': CHAR.NINE,
  '!': CHAR.EXCLAMATION,
  '@': CHAR.AT,
  '#': CHAR.POUND,
  $: CHAR.DOLLAR,
  '(': CHAR.LEFT_PAREN,
  ')': CHAR.RIGHT_PAREN,
  '-': CHAR.HYPHEN,
  '+': CHAR.PLUS,
  '&': CHAR.AMPERSAND,
  '=': CHAR.EQUAL,
  ';': CHAR.SEMICOLON,
  ':': CHAR.COLON,
  "'": CHAR.SINGLE_QUOTE,
  '"': CHAR.DOUBLE_QUOTE,
  '%': CHAR.PERCENT,
  ',': CHAR.COMMA,
  '.': CHAR.PERIOD,
  '/': CHAR.SLASH,
  '?': CHAR.QUESTION,
}

/** Full code → tile descriptor map. */
export const TILES = (() => {
  const tiles = {
    [CHAR.BLANK]: { code: CHAR.BLANK, type: 'blank', label: 'Blank' },
  }

  for (let i = 0; i < 26; i++) {
    const char = String.fromCharCode(65 + i)
    const code = CHAR.A + i
    tiles[code] = { code, type: 'char', char, label: char }
  }

  const digits = [
    [CHAR.ONE, '1'],
    [CHAR.TWO, '2'],
    [CHAR.THREE, '3'],
    [CHAR.FOUR, '4'],
    [CHAR.FIVE, '5'],
    [CHAR.SIX, '6'],
    [CHAR.SEVEN, '7'],
    [CHAR.EIGHT, '8'],
    [CHAR.NINE, '9'],
    [CHAR.ZERO, '0'],
  ]
  for (const [code, char] of digits) {
    tiles[code] = { code, type: 'char', char, label: char }
  }

  const punctuation = [
    [CHAR.EXCLAMATION, '!'],
    [CHAR.AT, '@'],
    [CHAR.POUND, '#'],
    [CHAR.DOLLAR, '$'],
    [CHAR.LEFT_PAREN, '('],
    [CHAR.RIGHT_PAREN, ')'],
    [CHAR.HYPHEN, '-'],
    [CHAR.PLUS, '+'],
    [CHAR.AMPERSAND, '&'],
    [CHAR.EQUAL, '='],
    [CHAR.SEMICOLON, ';'],
    [CHAR.COLON, ':'],
    [CHAR.SINGLE_QUOTE, "'"],
    [CHAR.DOUBLE_QUOTE, '"'],
    [CHAR.PERCENT, '%'],
    [CHAR.COMMA, ','],
    [CHAR.PERIOD, '.'],
    [CHAR.SLASH, '/'],
    [CHAR.QUESTION, '?'],
  ]
  for (const [code, char] of punctuation) {
    tiles[code] = { code, type: 'char', char, label: char }
  }

  for (const [name, code] of Object.entries(COLOR_NAMES)) {
    tiles[code] = {
      code,
      type: 'color',
      color: COLOR_HEX[code],
      name,
      label: name[0].toUpperCase() + name.slice(1),
    }
  }

  return tiles
})()

/**
 * Ordered flap wheel. Tiles rotate through this sequence when changing.
 * Gaps in numeric codes are intentional — only displayable tiles are included.
 */
export const FLIP_SEQUENCE = Object.keys(TILES)
  .map(Number)
  .sort((a, b) => a - b)

const FLIP_INDEX = new Map(FLIP_SEQUENCE.map((code, i) => [code, i]))

/**
 * Intermediate codes from one tile to another (shortest path on the wheel).
 * Example: A → D yields [B, C, D].
 */
export function getFlipPath(fromCode, toCode) {
  const from = FLIP_INDEX.has(fromCode) ? fromCode : CHAR.BLANK
  const to = FLIP_INDEX.has(toCode) ? toCode : CHAR.BLANK
  if (from === to) return []

  const start = FLIP_INDEX.get(from)
  const end = FLIP_INDEX.get(to)
  const n = FLIP_SEQUENCE.length
  const forward = (end - start + n) % n
  const backward = (start - end + n) % n
  const path = []

  if (forward <= backward) {
    for (let step = 1; step <= forward; step++) {
      path.push(FLIP_SEQUENCE[(start + step) % n])
    }
  } else {
    for (let step = 1; step <= backward; step++) {
      path.push(FLIP_SEQUENCE[(start - step + n) % n])
    }
  }

  return path
}

/** Look up a tile descriptor by numeric code. Unknown codes → blank. */
export function getTile(code) {
  return TILES[code] ?? TILES[CHAR.BLANK]
}

/** Code for a printable character (case-insensitive). Unsupported → blank. */
export function codeFromChar(char) {
  if (char == null || char === '') return CHAR.BLANK
  const key = typeof char === 'string' ? char.toUpperCase() : String(char)
  return CHAR_TO_CODE[key] ?? CHAR.BLANK
}

/** Code for a named color tile, e.g. "red" or "RED". */
export function codeFromColor(name) {
  const key = String(name).toLowerCase()
  return COLOR_NAMES[key] ?? CHAR.BLANK
}

/** Convenience: tile descriptor for a letter/digit/punctuation character. */
export function tileFromChar(char) {
  return getTile(codeFromChar(char))
}

/** Convenience: tile descriptor for a solid color chip. */
export function tileFromColor(name) {
  return getTile(codeFromColor(name))
}
