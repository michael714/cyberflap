import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AGENDA_LOADING_TEXT,
  AGENDA_UNAVAILABLE_TEXT,
} from './agenda'
import {
  getAgendaOnly,
  getAgendaPageIndex,
  getAgendaPaused,
  setAgendaOnly as persistAgendaOnly,
  setAgendaPageIndex,
  setAgendaPaused,
} from './agendaPrefs'
import { getClockText } from './clock'
import {
  BOARD_LAYOUT,
  CLOCK_TICK_MS,
  MODULE_ORDER,
  OVERRIDE_DURATION_MS,
  ROTATION_INTERVAL_MS,
} from './config'
import { DISPLAY_MODE, getDisplayMode } from './displayMode'
import { getMessage, OVERRIDE_SAMPLES, subscribeMessage } from './message'
import { useAgenda } from './useAgenda'
import { useDisplayMode } from './useDisplayMode'
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

function wrapIndex(index, length) {
  if (length <= 0) return 0
  return ((index % length) + length) % length
}

function agendaBoardText(agenda, pageIndex) {
  if (
    (agenda.status === 'loading' || agenda.status === 'idle') &&
    agenda.pages.length === 0
  ) {
    return AGENDA_LOADING_TEXT
  }
  if (agenda.status !== 'ready' || agenda.pages.length === 0) {
    return AGENDA_UNAVAILABLE_TEXT
  }
  const page = agenda.pages[wrapIndex(pageIndex, agenda.pages.length)]
  return page?.text ?? AGENDA_UNAVAILABLE_TEXT
}

/**
 * Cycles clock → weather → message, pushing text into the board layout.
 * Clock ticks every second while active; unchanged tiles do not reflip.
 * In agenda mode, Next/Prev walk published pages instead of modules.
 */
export function useContentRotation() {
  const [displayMode] = useDisplayMode()
  const isAgenda = displayMode === DISPLAY_MODE.AGENDA
  const agenda = useAgenda(isAgenda)
  const weatherText = useWeather()
  const [messageText, setMessageText] = useState(getMessage)
  const { board, setText } = useBoard(getClockText(), BOARD_LAYOUT)

  const [moduleIndex, setModuleIndex] = useState(() => {
    if (getDisplayMode() !== DISPLAY_MODE.AGENDA) return 0
    return getAgendaOnly() ? 0 : MODULE_ORDER.indexOf('message')
  })
  const [overrideText, setOverrideText] = useState(null)
  const [paused, setPaused] = useState(() =>
    getDisplayMode() === DISPLAY_MODE.AGENDA ? getAgendaPaused() : false,
  )
  const [agendaOnly, setAgendaOnlyState] = useState(getAgendaOnly)
  const [pageIndex, setPageIndexState] = useState(getAgendaPageIndex)
  /** Bumped on next/prev/resume to restart the auto-advance interval cleanly. */
  const [rotationEpoch, setRotationEpoch] = useState(0)
  const overrideTimerRef = useRef(null)
  const lastOverrideRef = useRef(null)

  useEffect(() => subscribeMessage(setMessageText), [])

  const moduleOrder =
    isAgenda && agendaOnly ? ['message'] : MODULE_ORDER
  const activeModule = moduleOrder[wrapIndex(moduleIndex, moduleOrder.length)] ?? 'clock'
  const isOverride = !isAgenda && overrideText != null
  const pageCount = agenda.pages.length
  const currentPageIndex = wrapIndex(pageIndex, Math.max(pageCount, 1))
  const currentPage = pageCount > 0 ? agenda.pages[currentPageIndex] : null

  const resolveText = useCallback(() => {
    if (isOverride) return overrideText
    if (activeModule === 'weather') return weatherText
    if (activeModule === 'message') {
      if (isAgenda) return agendaBoardText(agenda, pageIndex)
      return messageText
    }
    return getClockText()
  }, [
    isOverride,
    overrideText,
    activeModule,
    weatherText,
    isAgenda,
    agenda,
    pageIndex,
    messageText,
  ])

  useEffect(() => {
    setText(resolveText(), BOARD_LAYOUT)
  }, [resolveText, setText])

  useEffect(() => {
    if (isOverride || activeModule !== 'clock') return undefined

    const id = window.setInterval(() => {
      setText(getClockText(), BOARD_LAYOUT)
    }, CLOCK_TICK_MS)

    return () => window.clearInterval(id)
  }, [isOverride, activeModule, setText])

  useEffect(() => {
    if (isOverride || paused || moduleOrder.length <= 1) return undefined

    const id = window.setInterval(() => {
      setModuleIndex((index) => (index + 1) % moduleOrder.length)
    }, ROTATION_INTERVAL_MS)

    return () => window.clearInterval(id)
  }, [isOverride, paused, rotationEpoch, moduleOrder.length])

  useEffect(
    () => () => {
      if (overrideTimerRef.current != null) {
        window.clearTimeout(overrideTimerRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    if (!isAgenda || pageCount === 0) return
    setPageIndexState((index) => {
      const next = wrapIndex(index, pageCount)
      if (next !== index) setAgendaPageIndex(next)
      return next
    })
  }, [isAgenda, pageCount])

  useEffect(() => {
    if (isAgenda) {
      setPaused(getAgendaPaused())
      setAgendaOnlyState(getAgendaOnly())
      setPageIndexState(getAgendaPageIndex())
      setOverrideText(null)
      setModuleIndex(
        getAgendaOnly() ? 0 : MODULE_ORDER.indexOf('message'),
      )
      return
    }
    setPaused(false)
    setModuleIndex(0)
  }, [isAgenda])

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

  const showCurrentAgendaPage = useCallback(() => {
    setModuleIndex(
      agendaOnly ? 0 : MODULE_ORDER.indexOf('message'),
    )
    resetRotationTimer()
  }, [agendaOnly, resetRotationTimer])

  const goNext = useCallback(() => {
    if (isAgenda) {
      clearOverride()
      if (pageCount > 0) {
        setPageIndexState((index) => {
          const next = wrapIndex(index + 1, pageCount)
          setAgendaPageIndex(next)
          return next
        })
      }
      showCurrentAgendaPage()
      return
    }
    clearOverride()
    setModuleIndex((index) => (index + 1) % MODULE_ORDER.length)
    resetRotationTimer()
  }, [
    isAgenda,
    pageCount,
    clearOverride,
    showCurrentAgendaPage,
    resetRotationTimer,
  ])

  const goPrevious = useCallback(() => {
    if (isAgenda) {
      clearOverride()
      if (pageCount > 0) {
        setPageIndexState((index) => {
          const next = wrapIndex(index - 1, pageCount)
          setAgendaPageIndex(next)
          return next
        })
      }
      showCurrentAgendaPage()
      return
    }
    clearOverride()
    setModuleIndex(
      (index) => (index - 1 + MODULE_ORDER.length) % MODULE_ORDER.length,
    )
    resetRotationTimer()
  }, [
    isAgenda,
    pageCount,
    clearOverride,
    showCurrentAgendaPage,
    resetRotationTimer,
  ])

  const togglePause = useCallback(() => {
    const nextPaused = !paused
    if (isAgenda) setAgendaPaused(nextPaused)
    setPaused(nextPaused)
    if (paused) {
      setRotationEpoch((epoch) => epoch + 1)
    }
  }, [isAgenda, paused])

  const toggleAgendaOnly = useCallback(() => {
    const nextOnly = !agendaOnly
    persistAgendaOnly(nextOnly)
    setAgendaOnlyState(nextOnly)
    setModuleIndex(nextOnly ? 0 : MODULE_ORDER.indexOf('message'))
    setRotationEpoch((epoch) => epoch + 1)
  }, [agendaOnly])

  const triggerOverride = useCallback(() => {
    if (isAgenda) return
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
  }, [isAgenda, resetRotationTimer])

  return {
    board,
    displayMode,
    isAgenda,
    activeModule: isOverride ? 'override' : activeModule,
    isOverride,
    paused,
    agendaOnly,
    pageIndex: currentPageIndex,
    pageCount,
    pageLabel: currentPage?.label ?? '',
    agendaStatus: agenda.status,
    triggerOverride,
    goNext,
    goPrevious,
    togglePause,
    toggleAgendaOnly,
  }
}
