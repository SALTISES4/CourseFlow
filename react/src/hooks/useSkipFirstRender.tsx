import { useEffect, useRef } from 'react'

export default function useSkipFirstRender() {
  const isFirstRender = useRef(true)

  useEffect(() => {
    isFirstRender.current = false
  }, [])

  return isFirstRender.current
}
