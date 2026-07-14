import Tile from './Tile'
import { getRowTheme } from '../content/rainbow'
import { useRainbowMode } from '../content/useRainbowMode'
import { BOARD_RESIZE_MS, COLS } from '../utils/characters'
import './Board.css'

/** Deterministic per-cell start offset so mass updates feel organic. */
function staggerMs(row, col, colCount = COLS) {
  const index = row * colCount + col
  const wave = row * 28 + col * 14
  const jitter = (index * 47 + row * 13) % 90
  return wave + jitter
}

/**
 * @param {{ board: number[][] }} props
 */
function Board({ board }) {
  const [rainbowMode] = useRainbowMode()
  const rowCount = Math.max(1, board.length)

  return (
    <div
      className="board"
      role="img"
      aria-label={`CyberFlap display, ${rowCount} row${rowCount === 1 ? '' : 's'}`}
      style={{ '--board-resize-ms': `${BOARD_RESIZE_MS}ms` }}
    >
      <div
        className="board__grid"
        style={{
          '--board-rows': rowCount,
          gridTemplateColumns: `repeat(${COLS}, var(--tile-w))`,
          gridTemplateRows: `repeat(${rowCount}, var(--tile-h))`,
        }}
      >
        {board.map((row, rowIndex) => {
          const theme = getRowTheme(rowIndex, { rainbowMode, rowCount })
          return row.map((code, colIndex) => (
            <Tile
              key={`${rowIndex}-${colIndex}`}
              code={code}
              staggerMs={staggerMs(rowIndex, colIndex)}
              theme={theme}
            />
          ))
        })}
      </div>
    </div>
  )
}

export default Board
