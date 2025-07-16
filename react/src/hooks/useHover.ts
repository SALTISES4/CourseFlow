import { MutableRefObject, useEffect, useRef, useState } from 'react'

function useHover(
  ref?: MutableRefObject<HTMLElement>
): [MutableRefObject<HTMLElement>, boolean] {
  const [isHovered, setIsHovered] = useState(false)
  const internalRef = useRef<HTMLElement>(null)

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => setIsHovered(false)

  useEffect(() => {
    const node = ref ? ref.current : internalRef.current
    if (node) {
      node.addEventListener('mouseenter', handleMouseEnter)
      node.addEventListener('mouseleave', handleMouseLeave)

      return () => {
        node.removeEventListener('mouseenter', handleMouseEnter)
        node.removeEventListener('mouseleave', handleMouseLeave)
      }
    }
  }, [ref])

  return [ref ?? internalRef, isHovered]
}

export default useHover
