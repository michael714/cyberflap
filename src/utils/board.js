import {
  CHAR,
  COLS,
  MAX_ROWS,
  codeFromChar,
  getTile,
} from './characters'

/** Create a blank board with the given row count (1–MAX_ROWS). */
export function createEmptyBoard(rowCount = 1) {
  const rows = clampRowCount(rowCount)
  return Array.from({ length: rows }, () =>
    Array.from({ length: COLS }, () => CHAR.BLANK),
  )
}

function clampRowCount(rowCount) {
  const n = Number(rowCount)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(MAX_ROWS, Math.floor(n))
}

function cloneBoard(board) {
  return board.map((row) => row.slice())
}

function encodeWord(word) {
  return Array.from(word, (ch) => codeFromChar(ch))
}

/**
 * Wrap plain text into row arrays of character codes (length ≤ COLS each).
 * Words wrap to the next line when they fit there without splitting mid-word.
 * Oversized words hard-break. Extra content past MAX_ROWS is truncated.
 */
function wrapText(text) {
  const normalized = String(text ?? '')
    .toUpperCase()
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')

  const lines = []
  let row = []

  const pushRow = () => {
    if (lines.length >= MAX_ROWS) return false
    lines.push(row)
    row = []
    return lines.length < MAX_ROWS
  }

  const paragraphs = normalized.split('\n')

  for (let p = 0; p < paragraphs.length; p++) {
    if (lines.length >= MAX_ROWS) break

    const words = paragraphs[p].trim().split(/\s+/).filter(Boolean)

    if (words.length === 0) {
      if (!pushRow()) break
      continue
    }

    for (const word of words) {
      if (lines.length >= MAX_ROWS && row.length === 0) break

      let codes = encodeWord(word)

      while (codes.length > 0) {
        if (lines.length >= MAX_ROWS && row.length === 0) {
          codes = []
          break
        }

        const needsSpace = row.length > 0
        const spaceCost = needsSpace ? 1 : 0
        const room = COLS - row.length - spaceCost

        if (room <= 0) {
          if (!pushRow()) {
            codes = []
            break
          }
          continue
        }

        if (codes.length <= room) {
          if (needsSpace) row.push(CHAR.BLANK)
          row.push(...codes)
          codes = []
        } else if (row.length === 0) {
          // Word longer than a full row — hard-break.
          row.push(...codes.slice(0, COLS))
          codes = codes.slice(COLS)
          if (codes.length > 0 && !pushRow()) {
            codes = []
            break
          }
        } else {
          // Wrap to next line so the word stays intact if it fits.
          if (!pushRow()) {
            codes = []
            break
          }
        }
      }
    }

    if (row.length > 0 || p < paragraphs.length - 1) {
      if (!pushRow()) break
    }
  }

  if (row.length > 0 && lines.length < MAX_ROWS) {
    lines.push(row)
  }

  return lines.slice(0, MAX_ROWS)
}

function padRow(codes, align = 'left') {
  const clipped = codes.slice(0, COLS)
  const pad = COLS - clipped.length
  if (pad <= 0) return clipped

  if (align === 'right') {
    return [...Array(pad).fill(CHAR.BLANK), ...clipped]
  }

  if (align === 'center') {
    const left = Math.floor(pad / 2)
    const right = pad - left
    return [
      ...Array(left).fill(CHAR.BLANK),
      ...clipped,
      ...Array(right).fill(CHAR.BLANK),
    ]
  }

  return [...clipped, ...Array(pad).fill(CHAR.BLANK)]
}

/**
 * Lay plain text onto a dynamic-height board (1–MAX_ROWS × COLS).
 * Only rows that contain content are returned — no trailing empty rows.
 * @param {string} text
 * @param {{ align?: 'left'|'center'|'right' }} [options]
 * @returns {number[][]}
 */
export function layoutText(text, options = {}) {
  const { align = 'left' } = options
  const wrapped = wrapText(text).map((row) => padRow(row, align))

  if (wrapped.length === 0) {
    return createEmptyBoard(1)
  }

  return wrapped
}

/**
 * Plain-text wrap preview for settings: one string per board row (width = COLS).
 * Blanks render as spaces so a monospace grid matches the real layout.
 */
export function getPreviewLines(text, options = {}) {
  return layoutText(text, options).map((row) =>
    row
      .map((code) => {
        const tile = getTile(code)
        return tile.type === 'char' ? tile.char : ' '
      })
      .join(''),
  )
}

/**
 * Write codes into a board starting at (row, col). Out-of-bounds writes are skipped.
 */
export function setCodes(board, row, col, codes) {
  const next = cloneBoard(board)
  const rowCount = next.length
  for (let i = 0; i < codes.length; i++) {
    const r = row
    const c = col + i
    if (r >= 0 && r < rowCount && c >= 0 && c < COLS) {
      next[r][c] = codes[i]
    }
  }
  return next
}

export function boardsEqual(a, b) {
  if (a === b) return true
  if (!a || !b || a.length !== b.length) return false
  for (let row = 0; row < a.length; row++) {
    for (let col = 0; col < COLS; col++) {
      if (a[row][col] !== b[row][col]) return false
    }
  }
  return true
}
