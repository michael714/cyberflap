import { useCallback, useEffect, useState } from 'react'
import {
  getMuted,
  setMuted as persistMuted,
  subscribeMute,
  unlockAudio,
} from './flipSound'

/** Mute preference for flip click sounds. */
export function useFlipSound() {
  const [muted, setMutedState] = useState(getMuted)

  useEffect(() => subscribeMute(setMutedState), [])

  const setMuted = useCallback((nextMuted) => {
    persistMuted(nextMuted)
    if (!nextMuted) {
      unlockAudio()
    }
  }, [])

  const toggleMute = useCallback(() => {
    setMuted(!getMuted())
  }, [setMuted])

  return { muted, setMuted, toggleMute, unlockAudio }
}
