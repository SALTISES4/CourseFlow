import { MutableRefObject, useEffect, useRef, useState } from 'react'

function useHover(): [MutableRefObject<HTMLDivElement>, boolean] {
  const [isHovered, setIsHovered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => setIsHovered(false)

  useEffect(() => {
    const node = ref.current
    if (node) {
      node.addEventListener('mouseenter', handleMouseEnter)
      node.addEventListener('mouseleave', handleMouseLeave)

      return () => {
        node.removeEventListener('mouseenter', handleMouseEnter)
        node.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [])

  return [ref, isHovered]
}

export default useHover
