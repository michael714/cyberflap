import { useEffect, useRef, useState } from 'react'
import { FLIP_STEP_MS, getFlipPath, getTile } from '../utils/characters'
import { playFlipClick } from '../utils/flipSound'
import './Tile.css'

function TileFace({ code, theme }) {
  const tile = getTile(code)
  const themed = Boolean(theme)

  if (tile.type === 'color') {
    return (
      <div
        className="tile__face tile__face--color"
        style={{ '--tile-color': tile.color }}
      />
    )
  }

  if (tile.type === 'char') {
    return (
      <div
        className={`tile__face tile__face--char${themed ? ' tile__face--themed' : ''}`}
        style={
          themed
            ? {
                background: theme.background,
                color: theme.foreground,
              }
            : undefined
        }
      >
        <span className="tile__glyph">{tile.char}</span>
      </div>
    )
  }

  return (
    <div
      className={`tile__face tile__face--blank${themed ? ' tile__face--themed' : ''}`}
      style={themed ? { background: theme.background } : undefined}
    />
  )
}

/**
 * @param {{
 *   code: number,
 *   staggerMs?: number,
 *   theme?: { background: string, foreground: string } | null,
 * }} props
 */
function Tile({ code, staggerMs = 0, theme = null }) {
  const [displayCode, setDisplayCode] = useState(code)
  const [fromCode, setFromCode] = useState(code)
  const [toCode, setToCode] = useState(code)
  const [isFlipping, setIsFlipping] = useState(false)

  const displayRef = useRef(code)
  const animatingToRef = useRef(null)
  const queueRef = useRef([])
  const targetRef = useRef(code)
  const timerIdsRef = useRef([])
  const staggerRef = useRef(staggerMs)
  const reduceMotionRef = useRef(false)
  const engineRef = useRef({})

  staggerRef.current = staggerMs

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
  }, [])

  useEffect(() => {
    const clearTimers = () => {
      for (const id of timerIdsRef.current) {
        window.clearTimeout(id)
      }
      timerIdsRef.current = []
    }

    const schedule = (fn, ms) => {
      const id = window.setTimeout(fn, ms)
      timerIdsRef.current.push(id)
    }

    const finishStep = (nextCode) => {
      displayRef.current = nextCode
      animatingToRef.current = null
      setDisplayCode(nextCode)
      setFromCode(nextCode)
      setToCode(nextCode)
      setIsFlipping(false)

      if (queueRef.current.length === 0) return

      const following = queueRef.current.shift()
      schedule(() => engineRef.current.runStep(nextCode, following), 4)
    }

    const runStep = (from, to) => {
      if (from === to) {
        finishStep(to)
        return
      }

      animatingToRef.current = to
      setFromCode(from)
      setToCode(to)
      setIsFlipping(true)
      playFlipClick()
      schedule(() => finishStep(to), FLIP_STEP_MS)
    }

    const beginQueue = (path, delayMs) => {
      clearTimers()
      queueRef.current = path.slice()

      if (path.length === 0) {
        setIsFlipping(false)
        return
      }

      schedule(() => {
        const next = queueRef.current.shift()
        runStep(displayRef.current, next)
      }, Math.max(0, delayMs))
    }

    engineRef.current = { clearTimers, runStep, beginQueue }

    return () => {
      clearTimers()
    }
  }, [])

  useEffect(() => {
    if (code === targetRef.current) return

    targetRef.current = code
    const { clearTimers, beginQueue } = engineRef.current

    const origin =
      animatingToRef.current != null ? animatingToRef.current : displayRef.current
    const wasAnimating =
      animatingToRef.current != null || queueRef.current.length > 0

    if (reduceMotionRef.current) {
      clearTimers()
      queueRef.current = []
      animatingToRef.current = null
      displayRef.current = code
      setDisplayCode(code)
      setFromCode(code)
      setToCode(code)
      setIsFlipping(false)
      return
    }

    if (origin === code) {
      clearTimers()
      queueRef.current = []
      animatingToRef.current = null
      setIsFlipping(false)
      setFromCode(code)
      setToCode(code)
      setDisplayCode(code)
      displayRef.current = code
      return
    }

    clearTimers()
    queueRef.current = []
    animatingToRef.current = null
    displayRef.current = origin
    setDisplayCode(origin)
    setFromCode(origin)
    setToCode(origin)
    setIsFlipping(false)

    const path = getFlipPath(origin, code)
    // Only stagger fresh idle → target moves; mid-flight retargets resume immediately.
    const delay = wasAnimating ? 0 : staggerRef.current
    beginQueue(path, delay)
  }, [code])

  const label = getTile(displayCode).label ?? 'Blank'
  const staticTop = isFlipping ? toCode : displayCode
  const staticBottom = isFlipping ? fromCode : displayCode
  const themedStyle = theme
    ? {
        '--flip-ms': `${FLIP_STEP_MS}ms`,
        '--tile-bg': theme.background,
        '--tile-fg': theme.foreground,
      }
    : { '--flip-ms': `${FLIP_STEP_MS}ms` }

  return (
    <div
      className={`tile${isFlipping ? ' tile--flipping' : ''}${theme ? ' tile--rainbow' : ''}`}
      style={themedStyle}
      aria-label={label}
    >
      <div className="tile__half tile__half--top">
        <TileFace code={staticTop} theme={theme} />
      </div>
      <div className="tile__half tile__half--bottom">
        <TileFace code={staticBottom} theme={theme} />
      </div>

      {isFlipping && (
        <>
          <div key={`${fromCode}-${toCode}-top`} className="tile__flap tile__flap--top">
            <TileFace code={fromCode} theme={theme} />
          </div>
          <div
            key={`${fromCode}-${toCode}-bottom`}
            className="tile__flap tile__flap--bottom"
          >
            <TileFace code={toCode} theme={theme} />
          </div>
        </>
      )}

      <div className="tile__seam" aria-hidden="true" />
    </div>
  )
}

export default Tile
