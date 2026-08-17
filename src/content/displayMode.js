export const DISPLAY_MODE_STORAGE_KEY = 'cyberflap.displayMode'

export const DISPLAY_MODE = {
  DEMO: 'demo',
  AGENDA: 'agenda',
}

export const DEFAULT_DISPLAY_MODE = DISPLAY_MODE.DEMO

const listeners = new Set()

function normalizeMode(value) {
  return value === DISPLAY_MODE.AGENDA ? DISPLAY_MODE.AGENDA : DISPLAY_MODE.DEMO
}

function readStoredMode() {
  if (typeof window === 'undefined') return DEFAULT_DISPLAY_MODE
  try {
    return normalizeMode(window.localStorage.getItem(DISPLAY_MODE_STORAGE_KEY))
  } catch {
    return DEFAULT_DISPLAY_MODE
  }
}

let displayMode = readStoredMode()

export function getDisplayMode() {
  return displayMode
}

export function setDisplayMode(mode) {
  displayMode = normalizeMode(mode)
  try {
    window.localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, displayMode)
  } catch {
    // Persist best-effort; in-memory value still updates.
  }
  for (const listener of listeners) listener(displayMode)
  return displayMode
}

export function subscribeDisplayMode(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
