import { useCallback, useEffect, useRef, useState } from 'react'
import { getClockText } from './clock'
import {
  BOARD_LAYOUT,
  CLOCK_TICK_MS,
  MODULE_ORDER,
  OVERRIDE_DURATION_MS,
  ROTATION_INTERVAL_MS,
} from './config'
import { getMessage, OVERRIDE_SAMPLES, subscribeMessage } from './message'
import { useWeather } from './useWeather'
import { useBoard } from '../utils/useBoard'

function pickOverrideSample(previous) {
  if (OVERRIDE_SAMPLES.length === 1) return OVERRIDE_SAMPLES[0]
  let next = previous
  while (next === previous) {
    next = OVERRIDE_SAMPLES[Math.floor(Math.random() * OVERRIDE_SAMPLES.length)]
  }
  return next
}

/**
 * Cycles clock → weather → message, pushing text into the board layout.
 * Clock ticks every second while active; unchanged tiles do not reflip.
 */
export function useContentRotation() {
  const weatherText = useWeather()
  const [messageText, setMessageText] = useState(getMessage)
  const { board, setText } = useBoard(getClockText(), BOARD_LAYOUT)

  const [moduleIndex, setModuleIndex] = useState(0)
  const [overrideText, setOverrideText] = useState(null)
  const [paused, setPaused] = useState(false)
  /** Bumped on next/prev/resume to restart the auto-advance interval cleanly. */
  const [rotationEpoch, setRotationEpoch] = useState(0)
  const overrideTimerRef = useRef(null)
  const lastOverrideRef = useRef(null)

  useEffect(() => subscribeMessage(setMessageText), [])

  const activeModule = MODULE_ORDER[moduleIndex] ?? 'clock'
  const isOverride = overrideText != null

  const resolveText = useCallback(() => {
    if (overrideText != null) return overrideText
    if (activeModule === 'weather') return weatherText
    if (activeModule === 'message') return messageText
    return getClockText()
  }, [overrideText, activeModule, weatherText, messageText])

  // Publish content whenever the active source changes.
  useEffect(() => {
    setText(resolveText(), BOARD_LAYOUT)
  }, [resolveText, setText])

  // While the clock module is showing, refresh every second (partial flips only).
  useEffect(() => {
    if (isOverride || activeModule !== 'clock') return undefined

    const id = window.setInterval(() => {
      setText(getClockText(), BOARD_LAYOUT)
    }, CLOCK_TICK_MS)

    return () => window.clearInterval(id)
  }, [isOverride, activeModule, setText])

  // Advance modules on a fixed cadence unless paused or manually overridden.
  useEffect(() => {
    if (isOverride || paused) return undefined

    const id = window.setInterval(() => {
      setModuleIndex((index) => (index + 1) % MODULE_ORDER.length)
    }, ROTATION_INTERVAL_MS)

    return () => window.clearInterval(id)
  }, [isOverride, paused, rotationEpoch])

  useEffect(
    () => () => {
      if (overrideTimerRef.current != null) {
        window.clearTimeout(overrideTimerRef.current)
      }
    },
    [],
  )

  const clearOverride = useCallback(() => {
    if (overrideTimerRef.current != null) {
      window.clearTimeout(overrideTimerRef.current)
      overrideTimerRef.current = null
    }
    setOverrideText(null)
  }, [])

  const resetRotationTimer = useCallback(() => {
    setRotationEpoch((epoch) => epoch + 1)
  }, [])

  const goNext = useCallback(() => {
    clearOverride()
    setModuleIndex((index) => (index + 1) % MODULE_ORDER.length)
    resetRotationTimer()
  }, [clearOverride, resetRotationTimer])

  const goPrevious = useCallback(() => {
    clearOverride()
    setModuleIndex(
      (index) => (index - 1 + MODULE_ORDER.length) % MODULE_ORDER.length,
    )
    resetRotationTimer()
  }, [clearOverride, resetRotationTimer])

  const togglePause = useCallback(() => {
    setPaused((wasPaused) => {
      const nextPaused = !wasPaused
      // Resuming: restart the dwell timer from the current module.
      if (wasPaused) {
        setRotationEpoch((epoch) => epoch + 1)
      }
      return nextPaused
    })
  }, [])

  const triggerOverride = useCallback(() => {
    const sample = pickOverrideSample(lastOverrideRef.current)
    lastOverrideRef.current = sample
    setOverrideText(sample)

    if (overrideTimerRef.current != null) {
      window.clearTimeout(overrideTimerRef.current)
    }

    overrideTimerRef.current = window.setTimeout(() => {
      setOverrideText(null)
      overrideTimerRef.current = null
      resetRotationTimer()
    }, OVERRIDE_DURATION_MS)
  }, [resetRotationTimer])

  return {
    board,
    activeModule: isOverride ? 'override' : activeModule,
    isOverride,
    paused,
    triggerOverride,
    goNext,
    goPrevious,
    togglePause,
  }
}
