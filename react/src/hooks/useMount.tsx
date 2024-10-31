import {useEffect, useRef} from 'react'

function useMount() {
  const renderCount = useRef(0)
  renderCount.current++

  useEffect(() => {
    console.log('Component mounted')

    return () => {
      console.log('Component will unmount')
    }
  }, []) // The empty dependency array ensures this effect runs only once.
}

export default useMount
