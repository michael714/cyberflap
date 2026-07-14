import { useCallback, useState } from 'react'
import { boardsEqual, createEmptyBoard, layoutText } from './board'

/**
 * Board state hook. Starts empty, or with optional initial text layout.
 * setText skips state updates when the laid-out codes are unchanged so
 * ticking content (clock) only flips tiles that actually changed.
 * @param {string} [initialText]
 * @param {{ align?: 'left'|'center'|'right' }} [options]
 */
export function useBoard(initialText, options) {
  const [board, setBoard] = useState(() =>
    initialText != null && initialText !== ''
      ? layoutText(initialText, options)
      : createEmptyBoard(1),
  )

  const setText = useCallback((text, layoutOptions) => {
    const next = layoutText(text, layoutOptions)
    setBoard((prev) => (boardsEqual(prev, next) ? prev : next))
  }, [])

  const clear = useCallback(() => {
    setBoard(createEmptyBoard(1))
  }, [])

  return { board, setBoard, setText, clear }
}
