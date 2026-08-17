/** Shared timing + layout defaults for content rotation. */

export const ROTATION_INTERVAL_MS = 10_000
export const OVERRIDE_DURATION_MS = 10_000
export const CLOCK_TICK_MS = 1_000
export const WEATHER_REFRESH_MS = 15 * 60 * 1000
/** How often agenda mode re-fetches agenda.txt from GitHub (or /agenda.txt in dev). */
export const AGENDA_POLL_MS = 2 * 60 * 1000

export const BOARD_LAYOUT = {
  align: 'center',
}

export const MODULE_ORDER = ['clock', 'weather', 'message']
