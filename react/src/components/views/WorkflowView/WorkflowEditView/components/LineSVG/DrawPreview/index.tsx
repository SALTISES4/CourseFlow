import { RootState } from '@cfRedux/store'
import { getSimpleBezierPath } from '@xyflow/react'
import { MutableRefObject } from 'react'
import { useSelector } from 'react-redux'

type PropsType = {
  svgRef: MutableRefObject<SVGSVGElement | null>
}

const DrawPreview = ({ svgRef }: PropsType) => {
  const coords = useSelector((state: RootState) => state.svglink.dragging)

  if (!coords.from || !coords.to || !svgRef.current) {
    return null
  }

  const svgBCR = svgRef.current.getBoundingClientRect()

  const [path] = getSimpleBezierPath({
    sourceX: coords.from.x + window.scrollX - svgBCR.left,
    sourceY: coords.from.y + window.scrollY - svgBCR.top,
    sourcePosition: coords.from.edge,
    targetX: coords.to.x + window.scrollX - svgBCR.left,
    targetY: coords.to.y + window.scrollY - svgBCR.top,
    targetPosition: coords.to.edge ?? undefined
  })

  return (
    <g id="draw-preview" fill="none">
      <path d={path} stroke="orange" strokeWidth="3" fill="none" />
    </g>
  )
}

export default DrawPreview
