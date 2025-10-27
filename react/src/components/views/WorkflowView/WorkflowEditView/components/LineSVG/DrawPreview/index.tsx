import { DragPosition } from '@cf/redux/slices/svglink.slice'
import { RootState } from '@cfRedux/store'
import { Position, getSmoothStepPath, getStraightPath } from '@xyflow/react'
import { MutableRefObject } from 'react'
import { useSelector } from 'react-redux'

import type { NodeBCR } from '../'

type PropsType = {
  svgRef: MutableRefObject<SVGSVGElement | null>
  nodesBCR: Record<number, NodeBCR>
}

function findNearestRect(
  coords: { anchorNodeId: number; x: number; y: number },
  rects: Record<number, NodeBCR>
): DragPosition | null {
  const snapThreshold = 25
  const potentialTargets: Map<string, NodeBCR> = new Map() // hashmap ftw

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
    if (nodeId === String(coords.anchorNodeId)) {
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
  const editing = useSelector((state: RootState) => state.svglink.editing)

  if (!coords.from || !coords.to || !svgRef.current) {
    return null
  }

  const snapTarget = findNearestRect(
    editing === 'from'
      ? {
          anchorNodeId: coords.to.nodeId,
          x: coords.from.x,
          y: coords.from.y
        }
      : {
          anchorNodeId: coords.from.nodeId,
          x: coords.to.x,
          y: coords.to.y
        },
    nodesBCR
  )

  const source = editing === 'from' ? coords.to : coords.from
  const target = snapTarget ?? (editing === 'from' ? coords.from : coords.to)

  const pathArgs = {
    sourceX: source.x,
    sourceY: source.y,
    sourcePosition: source.edge,
    targetX: target.x,
    targetY: target.y,
    targetPosition: target.edge ?? undefined
  }

  const [path] = snapTarget
    ? getSmoothStepPath(pathArgs)
    : getStraightPath(pathArgs)

  return <path d={path} stroke="orange" strokeWidth="3" fill="none" />
}

export default DrawPreview
