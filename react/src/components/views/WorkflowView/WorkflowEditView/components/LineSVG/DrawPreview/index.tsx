import { Position, getSmoothStepPath } from '@xyflow/react'

type PropsType = {
  coords: null | {
    from: { x: number; y: number; edge: Position }
    to: { x: number; y: number; edge: Position }
  }
}

const DrawPreview = ({ coords }: PropsType) => {
  const [path] = getSmoothStepPath({
    sourceX: coords.from.x,
    sourceY: coords.from.y,
    sourcePosition: coords.from.edge,
    targetX: coords.to.x,
    targetY: coords.to.y,
    targetPosition: coords.to.edge
  })

  return (
    <g id="draw-preview" fill="none">
      <path d={path} stroke="orange" strokeWidth="3" fill="none" />
    </g>
  )
}

export default DrawPreview
