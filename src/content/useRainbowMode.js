import { useCallback, useEffect, useState } from 'react'
import {
  getRainbowMode,
  setRainbowMode as persistRainbowMode,
  subscribeRainbowMode,
} from './rainbow'

/** Live rainbowMode flag, persisted to localStorage. */
export function useRainbowMode() {
  const [rainbowMode, setRainbowModeState] = useState(getRainbowMode)

  useEffect(() => subscribeRainbowMode(setRainbowModeState), [])

  const setRainbowMode = useCallback((enabled) => {
    persistRainbowMode(enabled)
  }, [])

  return [rainbowMode, setRainbowMode]
}
