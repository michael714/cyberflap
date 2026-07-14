import { useEffect, useState } from 'react'
import { startWeatherUpdates } from './weather'

/** Live weather text for the board, refreshed every 15 minutes. */
export function useWeather() {
  const [text, setText] = useState('WEATHER\nLOADING')

  useEffect(() => startWeatherUpdates(setText), [])

  return text
}
