import { useEffect, useState } from 'react'
import { getAgenda, subscribeAgenda } from './agenda'

/** Live published agenda deck. Polls only while at least one consumer is mounted. */
export function useAgenda(enabled = true) {
  const [agenda, setAgenda] = useState(getAgenda)

  useEffect(() => {
    if (!enabled) return undefined
    return subscribeAgenda(setAgenda)
  }, [enabled])

  return agenda
}
