import { useCallback, useState } from 'react'

const LOCAL_STORAGE_KEY = 'show_legend'

const useLegend = () => {
  const [show, setShow] = useState<boolean>(() => {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || 'false')
  })

  const toggle = useCallback(() => {
    const newshow = !show
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newshow))
    setShow(newshow)
  }, [show])

  return {
    show,
    toggle
  }
}

export default useLegend
