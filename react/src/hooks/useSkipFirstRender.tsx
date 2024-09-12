import { useEffect, useState } from 'react'

export default function useSkipFirstRender() {
  const [hasRendered, setHasRendered] = useState(false)

  useEffect(() => {
    if (!hasRendered) {
      setHasRendered(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return hasRendered
}
