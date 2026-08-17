export const AGENDA_PAGE_INDEX_KEY = 'cyberflap.agendaPageIndex'
export const AGENDA_ONLY_KEY = 'cyberflap.agendaOnly'
export const AGENDA_PAUSED_KEY = 'cyberflap.agendaPaused'

function readBool(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = window.localStorage.getItem(key)
    if (stored == null) return fallback
    return stored === 'true'
  } catch {
    return fallback
  }
}

function writeBool(key, value) {
  try {
    window.localStorage.setItem(key, String(Boolean(value)))
  } catch {
    // Persist best-effort.
  }
}

function readInt(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = window.localStorage.getItem(key)
    if (stored == null) return fallback
    const n = Number.parseInt(stored, 10)
    return Number.isFinite(n) && n >= 0 ? n : fallback
  } catch {
    return fallback
  }
}

function writeInt(key, value) {
  try {
    window.localStorage.setItem(key, String(value))
  } catch {
    // Persist best-effort.
  }
}

export function getAgendaPageIndex() {
  return readInt(AGENDA_PAGE_INDEX_KEY, 0)
}

export function setAgendaPageIndex(index) {
  writeInt(AGENDA_PAGE_INDEX_KEY, Math.max(0, Math.floor(index)))
}

export function getAgendaOnly() {
  return readBool(AGENDA_ONLY_KEY, false)
}

export function setAgendaOnly(enabled) {
  writeBool(AGENDA_ONLY_KEY, enabled)
}

export function getAgendaPaused() {
  return readBool(AGENDA_PAUSED_KEY, false)
}

export function setAgendaPaused(paused) {
  writeBool(AGENDA_PAUSED_KEY, paused)
}
