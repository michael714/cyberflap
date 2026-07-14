/**
 * Single-line clock so short content uses 1 active board row.
 * Seconds keep the board alive while displayed; unchanged tiles do not reflip.
 *
 * Example: 3:45:09 PM
 */
export function getClockText(now = new Date()) {
  let hours = now.getHours()
  const minutes = now.getMinutes()
  const seconds = now.getSeconds()
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12

  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  return `${hours}:${mm}:${ss} ${ampm}`
}
