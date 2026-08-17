import { useCallback, useEffect, useState } from 'react'
import {
  getDisplayMode,
  setDisplayMode as persistDisplayMode,
  subscribeDisplayMode,
} from './displayMode'

/** Live display mode (`demo` | `agenda`), persisted to localStorage. */
export function useDisplayMode() {
  const [displayMode, setDisplayModeState] = useState(getDisplayMode)

  useEffect(() => subscribeDisplayMode(setDisplayModeState), [])

  const setDisplayMode = useCallback((mode) => {
    persistDisplayMode(mode)
  }, [])

  return [displayMode, setDisplayMode]
}
