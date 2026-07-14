export const MESSAGE_STORAGE_KEY = 'cyberflap.customMessage'

export const DEFAULT_MESSAGE = [
  'CYBERFLAP IS LIVE',
  'AND READY TO SHOW',
  'YOUR CUSTOM NOTES',
  'CLOCK AND WEATHER',
  'IN SPLIT FLAP STYLE',
  'STAY CURIOUS ALWAYS',
].join('\n')

const listeners = new Set()

function readStoredMessage() {
  if (typeof window === 'undefined') return DEFAULT_MESSAGE
  try {
    const stored = window.localStorage.getItem(MESSAGE_STORAGE_KEY)
    if (stored != null) return stored
  } catch {
    // Private mode / blocked storage — fall through to default.
  }
  return DEFAULT_MESSAGE
}

let customMessage = readStoredMessage()

export function getMessage() {
  return customMessage
}

export function setMessage(text) {
  customMessage = String(text ?? '')
  try {
    window.localStorage.setItem(MESSAGE_STORAGE_KEY, customMessage)
  } catch {
    // Persist best-effort; in-memory value still updates.
  }
  for (const listener of listeners) {
    listener(customMessage)
  }
  return customMessage
}

/** Subscribe to message changes (settings save, other tabs via focus refresh). */
export function subscribeMessage(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Quick demos for the manual-override button (mix of short and longer). */
export const OVERRIDE_SAMPLES = [
  'HELLO WORLD',
  'SYSTEM READY',
  'MAKE SOME NOISE',
  'DOORS OPENING',
  'STAY CURIOUS',
  'CODE / CREATE',
  'NEXT STOP HOME',
  'THE QUICK BROWN FOX\nJUMPS OVER THE LAZY\nDOG ON CYBERFLAP',
]
