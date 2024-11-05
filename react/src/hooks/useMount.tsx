import Utility from '@cf/utility/Utility.class'
import { useEffect, useRef } from 'react'

function useMount() {
  const renderCount = useRef(0)
  renderCount.current++

  useEffect(() => {
    Utility.logger('Component mounted')

    return () => {
      Utility.logger('Component will unmount')
    }
  }, []) // The empty dependency array ensures this effect runs only once.
}

export default useMount
