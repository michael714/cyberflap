import { WEATHER_REFRESH_MS } from './config'

/** San Francisco — used when geolocation is unavailable or denied. */
export const FALLBACK_COORDS = {
  latitude: 37.7749,
  longitude: -122.4194,
  label: 'SF',
}

const WMO_LABELS = {
  0: 'CLEAR',
  1: 'MOSTLY CLEAR',
  2: 'PARTLY CLOUDY',
  3: 'CLOUDY',
  45: 'FOG',
  48: 'FOG',
  51: 'DRIZZLE',
  53: 'DRIZZLE',
  55: 'DRIZZLE',
  56: 'FREEZING DRIZZLE',
  57: 'FREEZING DRIZZLE',
  61: 'RAIN',
  63: 'RAIN',
  65: 'HEAVY RAIN',
  66: 'FREEZING RAIN',
  67: 'FREEZING RAIN',
  71: 'SNOW',
  73: 'SNOW',
  75: 'HEAVY SNOW',
  77: 'SNOW GRAINS',
  80: 'SHOWERS',
  81: 'SHOWERS',
  82: 'HEAVY SHOWERS',
  85: 'SNOW SHOWERS',
  86: 'SNOW SHOWERS',
  95: 'THUNDER',
  96: 'THUNDER',
  99: 'THUNDER',
}

function conditionLabel(code) {
  return WMO_LABELS[code] ?? 'UNKNOWN'
}

function formatTemp(value) {
  if (value == null || Number.isNaN(Number(value))) return '--F'
  return `${Math.round(Number(value))}F`
}

/**
 * Board-friendly weather text (no degree symbol — not on the flap wheel).
 *
 * Example:
 *   72F CLEAR
 *   H 78 / L 61
 */
export function formatWeatherText(data) {
  const current = data?.current ?? {}
  const daily = data?.daily ?? {}
  const temp = formatTemp(current.temperature_2m)
  const condition = conditionLabel(current.weather_code)
  const high = formatTemp(daily.temperature_2m_max?.[0])
  const low = formatTemp(daily.temperature_2m_min?.[0])

  return `${temp} ${condition}\nH ${high} / L ${low}`
}

export async function fetchWeather(coords = FALLBACK_COORDS) {
  const params = new URLSearchParams({
    latitude: String(coords.latitude),
    longitude: String(coords.longitude),
    current: 'temperature_2m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min',
    temperature_unit: 'fahrenheit',
    timezone: 'auto',
    forecast_days: '1',
  })

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
  )

  if (!response.ok) {
    throw new Error(`Weather request failed (${response.status})`)
  }

  return response.json()
}

function readGeolocation() {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(FALLBACK_COORDS)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => resolve(FALLBACK_COORDS),
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 10 * 60 * 1000,
      },
    )
  })
}

/**
 * Resolve coords, fetch conditions, and refresh on an interval.
 * @param {(text: string) => void} onUpdate
 * @returns {() => void} cleanup
 */
export function startWeatherUpdates(onUpdate) {
  let cancelled = false
  let refreshId = null
  let coords = FALLBACK_COORDS

  const push = (text) => {
    if (!cancelled) onUpdate(text)
  }

  const load = async () => {
    try {
      const data = await fetchWeather(coords)
      push(formatWeatherText(data))
    } catch {
      push('WEATHER\nUNAVAILABLE')
    }
  }

  push('WEATHER\nLOADING')

  ;(async () => {
    coords = await readGeolocation()
    if (cancelled) return
    await load()
    if (cancelled) return
    refreshId = window.setInterval(load, WEATHER_REFRESH_MS)
  })()

  return () => {
    cancelled = true
    if (refreshId != null) window.clearInterval(refreshId)
  }
}
