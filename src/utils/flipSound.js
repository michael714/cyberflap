export const MUTE_STORAGE_KEY = 'cyberflap.mute'
export const DEFAULT_MUTED = false

const CLICK_DURATION_S = 0.03
const BASE_GAIN = 0.055
const MAX_VOICES = 12
const MASTER_GAIN = 0.85

let audioContext = null
let masterGainNode = null
let activeVoices = 0
let muted = readStoredMute()
let unlockBound = false

const muteListeners = new Set()

function readStoredMute() {
  if (typeof window === 'undefined') return DEFAULT_MUTED
  try {
    const stored = window.localStorage.getItem(MUTE_STORAGE_KEY)
    if (stored === null) return DEFAULT_MUTED
    return stored === 'true'
  } catch {
    return DEFAULT_MUTED
  }
}

function getAudioContext() {
  if (typeof window === 'undefined') return null
  if (audioContext) return audioContext

  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null

  audioContext = new AudioCtx()
  masterGainNode = audioContext.createGain()
  masterGainNode.gain.value = MASTER_GAIN
  masterGainNode.connect(audioContext.destination)
  return audioContext
}

function createNoiseBuffer(ctx, durationSec) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * durationSec))
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) {
    // Soften trailing samples so the click dies cleanly.
    const envelope = 1 - i / length
    data[i] = (Math.random() * 2 - 1) * envelope
  }
  return buffer
}

/** Resume AudioContext after a user gesture (required by browsers). */
export function unlockAudio() {
  const ctx = getAudioContext()
  if (!ctx) return Promise.resolve()
  if (ctx.state === 'suspended') {
    return ctx.resume().catch(() => {})
  }
  return Promise.resolve()
}

/** Install one-time listeners so the first click/keypress unlocks audio. */
export function bindAudioUnlock() {
  if (typeof window === 'undefined' || unlockBound) return () => {}
  unlockBound = true

  const unlock = () => {
    unlockAudio()
  }

  window.addEventListener('pointerdown', unlock, { passive: true })
  window.addEventListener('keydown', unlock, { passive: true })

  return () => {
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
    unlockBound = false
  }
}

export function getMuted() {
  return muted
}

export function setMuted(nextMuted) {
  muted = Boolean(nextMuted)
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, String(muted))
  } catch {
    // Persist best-effort.
  }
  for (const listener of muteListeners) {
    listener(muted)
  }
  return muted
}

export function subscribeMute(listener) {
  muteListeners.add(listener)
  return () => muteListeners.delete(listener)
}

/**
 * Play one short mechanical clack for a single flip step.
 * Voice-capped and gain-scaled so dense board updates stay clean.
 */
export function playFlipClick() {
  if (muted) return

  const ctx = getAudioContext()
  if (!ctx || !masterGainNode) return
  if (ctx.state === 'suspended') return
  if (activeVoices >= MAX_VOICES) return

  const now = ctx.currentTime
  const duration = CLICK_DURATION_S
  const voiceSlot = activeVoices + 1
  activeVoices = voiceSlot

  const source = ctx.createBufferSource()
  source.buffer = createNoiseBuffer(ctx, duration)

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  // Slight pitch jitter so stacked clicks don't phase into one tone.
  filter.frequency.value = 1400 + Math.random() * 1200
  filter.Q.value = 0.65 + Math.random() * 0.45

  const highpass = ctx.createBiquadFilter()
  highpass.type = 'highpass'
  highpass.frequency.value = 400

  const gain = ctx.createGain()
  // Reduce per-voice level as more clicks overlap (sqrt curve).
  const voiceGain = BASE_GAIN / Math.sqrt(Math.max(1, voiceSlot * 0.65))
  gain.gain.setValueAtTime(voiceGain, now)
  gain.gain.exponentialRampToValueAtTime(0.0008, now + duration)

  source.connect(highpass)
  highpass.connect(filter)
  filter.connect(gain)
  gain.connect(masterGainNode)

  source.start(now)
  source.stop(now + duration + 0.01)

  let released = false
  const release = () => {
    if (released) return
    released = true
    activeVoices = Math.max(0, activeVoices - 1)
    source.onended = null
  }
  source.onended = release
  window.setTimeout(release, (duration + 0.05) * 1000)
}
