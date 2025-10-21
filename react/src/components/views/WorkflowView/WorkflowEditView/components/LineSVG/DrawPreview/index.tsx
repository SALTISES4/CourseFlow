import { DragPosition } from '@cf/redux/slices/svglink.slice'
import { RootState } from '@cfRedux/store'
import { Position, getSmoothStepPath, getStraightPath } from '@xyflow/react'
import { MutableRefObject } from 'react'
import { useSelector } from 'react-redux'

type PropsType = {
  svgRef: MutableRefObject<SVGSVGElement | null>
  nodesBCR: Record<number, DOMRect>
}

function findNearestRect(
  coords: { id: number; x: number; y: number },
  rects: Record<number, DOMRect>
): DragPosition | null {
  const snapThreshold = 25
  const potentialTargets: Map<string, DOMRect> = new Map() // hashmap ftw

  for (const [nodeId, rect] of Object.entries(rects)) {
    const isNearEdge =
      coords.x >= rect.left - snapThreshold &&
      coords.x <= rect.right + snapThreshold &&
      coords.y >= rect.top - snapThreshold &&
      coords.y <= rect.bottom + snapThreshold

    const isInside =
      coords.x >= rect.left &&
      coords.x <= rect.right &&
      coords.y >= rect.top &&
      coords.y <= rect.bottom

    if (isNearEdge || isInside) {
      potentialTargets.set(nodeId, rect)
    } else {
      potentialTargets.delete(nodeId)
    }
  }

  if (potentialTargets.size) {
    // grab first child from the map iterator
    const [nodeId, rect] = potentialTargets.entries().next().value

    // early exit if we're checking the self as the nearest node
    if (nodeId === String(coords.id)) {
      return null
    }

    // currently closest handle is "empty"
    let closest: [number, number, Position] | null = null
    const handles: [number, number, Position][] = [
      [rect.x + rect.width / 2, rect.y, Position.Top],
      [rect.x + rect.width, rect.y + rect.height / 2, Position.Right],
      [rect.x + rect.width / 2, rect.y + rect.height, Position.Bottom],
      [rect.x, rect.y + rect.height / 2, Position.Left]
    ]

    // find closest handle
    for (const handle of handles) {
      const [handleX, handleY] = handle
      if (
        Math.abs(handleX - coords.x) > snapThreshold ||
        Math.abs(handleY - coords.y) > snapThreshold
      ) {
        continue
      } else {
        closest = handle
      }
    }

    if (!closest) {
      return null
    }

    const [targetX, targetY, targetEdge] = closest

    return {
      nodeId: parseInt(nodeId, 10),
      x: targetX,
      y: targetY,
      edge: targetEdge
    }
  }

  return null
}

const DrawPreview = ({ svgRef, nodesBCR }: PropsType) => {
  const coords = useSelector((state: RootState) => state.svglink.dragging)

  if (!coords.from || !coords.to || !svgRef.current) {
    return null
  }

  const snapTarget = findNearestRect(
    { id: coords.from.nodeId, x: coords.to.x, y: coords.to.y },
    nodesBCR
  )

  const svgBCR = svgRef.current.getBoundingClientRect()
  const target = snapTarget ?? coords.to

  const pathArgs = {
    sourceX: coords.from.x - svgBCR.left,
    sourceY: coords.from.y - svgBCR.top,
    sourcePosition: coords.from.edge,
    targetX: target.x - svgBCR.left,
    targetY: target.y - svgBCR.top,
    targetPosition: target.edge ?? undefined
  }

  const [path] = snapTarget
    ? getSmoothStepPath(pathArgs)
    : getStraightPath(pathArgs)

  return (
    <g id="draw-preview" fill="none">
      <path d={path} stroke="orange" strokeWidth="3" fill="none" />
    </g>
  )
}

export default DrawPreview
