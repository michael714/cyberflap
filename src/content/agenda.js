import { AGENDA_POLL_MS } from './config'

export const AGENDA_GITHUB_URL =
  'https://raw.githubusercontent.com/michael714/cyberflap/main/agenda.txt'
export const AGENDA_GITHUB_API_URL =
  'https://api.github.com/repos/michael714/cyberflap/contents/agenda.txt'

export const AGENDA_LOADING_TEXT = 'LOADING AGENDA'
export const AGENDA_UNAVAILABLE_TEXT = [
  'AGENDA NOT FOUND',
  'UPLOAD AGENDA.TXT',
  'ON GITHUB',
].join('\n')

const HEADER = /^===\s*(.*?)\s*$/

/**
 * Split an agenda.txt body into labeled pages.
 * Lines before the first === are ignored. Pages with no body are skipped.
 * A file with content but no === headers becomes a single page.
 */
export function parseAgenda(raw) {
  const text = String(raw ?? '').replace(/\r\n/g, '\n')
  const trimmed = text.trim()
  if (!trimmed) return []

  const lines = text.split('\n')
  const hasHeader = lines.some((line) => HEADER.test(line))

  if (!hasHeader) {
    return [{ label: 'AGENDA', text: trimmed }]
  }

  const pages = []
  let label = ''
  let body = []
  let started = false

  const flush = () => {
    if (!started) return
    const pageText = body.join('\n').trim()
    if (!pageText) return
    pages.push({
      label: label.trim() || `PAGE ${pages.length + 1}`,
      text: pageText,
    })
  }

  for (const line of lines) {
    const match = line.match(HEADER)
    if (match) {
      flush()
      started = true
      label = match[1]
      body = []
      continue
    }
    if (started) body.push(line)
  }
  flush()

  return pages
}

const EMPTY_SNAPSHOT = {
  pages: [],
  status: 'idle',
}

let snapshot = EMPTY_SNAPSHOT
const listeners = new Set()
let subscriberCount = 0
let pollId = null
let fetchGeneration = 0

function emit() {
  for (const listener of listeners) listener(snapshot)
}

function agendaUrl() {
  if (import.meta.env.DEV) return '/agenda.txt'
  return `${AGENDA_GITHUB_URL}?t=${Date.now()}`
}

async function readGithubApiText() {
  const response = await fetch(AGENDA_GITHUB_API_URL, {
    cache: 'no-store',
    headers: { Accept: 'application/vnd.github.raw' },
  })
  if (!response.ok) return null
  return response.text()
}

async function readAgendaText() {
  const primary = agendaUrl()
  try {
    const response = await fetch(primary, { cache: 'no-store' })
    if (response.ok) return await response.text()
  } catch {
    // Fall through to the GitHub API (CORS / 404 / network).
  }

  if (!import.meta.env.DEV) {
    try {
      const fromApi = await readGithubApiText()
      if (fromApi != null) return fromApi
    } catch {
      // Unavailable — caller keeps the last good deck when possible.
    }
  }

  return null
}

async function refreshAgenda() {
  const generation = ++fetchGeneration
  const hadPages = snapshot.pages.length > 0

  if (snapshot.status === 'idle') {
    snapshot = { pages: snapshot.pages, status: 'loading' }
    emit()
  }

  const raw = await readAgendaText()
  if (generation !== fetchGeneration) return

  if (raw == null) {
    if (hadPages) return
    snapshot = { pages: [], status: 'unavailable' }
    emit()
    return
  }

  const pages = parseAgenda(raw)
  snapshot = {
    pages,
    status: pages.length > 0 ? 'ready' : 'unavailable',
  }
  emit()
}

function startPolling() {
  if (pollId != null) return
  refreshAgenda()
  pollId = window.setInterval(() => {
    refreshAgenda()
  }, AGENDA_POLL_MS)
}

function stopPolling() {
  if (pollId == null) return
  window.clearInterval(pollId)
  pollId = null
}

export function getAgenda() {
  return snapshot
}

/** Subscribe to published agenda pages. Starts GitHub/local polling on first listener. */
export function subscribeAgenda(listener) {
  listeners.add(listener)
  subscriberCount += 1
  if (subscriberCount === 1) startPolling()
  listener(snapshot)
  return () => {
    listeners.delete(listener)
    subscriberCount -= 1
    if (subscriberCount === 0) stopPolling()
  }
}
