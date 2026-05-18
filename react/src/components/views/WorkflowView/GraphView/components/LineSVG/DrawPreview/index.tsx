import {
  DragPosition,
  svglinkDragSnap
} from '@cf/features/graph/state/slices/svglink.slice'
import { RootState } from '@cfRedux/store'
import { Position, getSmoothStepPath, getStraightPath } from '@xyflow/react'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

type PropsType = {
  nodesBCR: Record<string, NodeBCR>
}

export interface NodeBCR {
  x: number
  y: number
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

function findNearestRect(
  coords: { anchorNodeUuid: string; x: number; y: number },
  rects: Record<string, NodeBCR>
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
    if (nodeId === coords.anchorNodeUuid) {
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
      nodeUuid: nodeId,
      x: targetX,
      y: targetY,
      edge: targetEdge
    }
  }

  return null
}

const DrawPreview = ({ nodesBCR }: PropsType) => {
  const coords = useSelector((state: RootState) => state.svglink.dragging)
  const editing = useSelector((state: RootState) => state.svglink.editing)
  const [snapTo, setSnapTo] = useState<DragPosition | null>(null)
  const dispatch = useDispatch()

  const snapTarget = useMemo(() => {
    if (!coords.from || !coords.to) {
      return null
    }

    return findNearestRect(
      editing === 'from'
        ? {
            anchorNodeUuid: coords.to.nodeUuid ?? '',
            x: coords.from.x,
            y: coords.from.y
          }
        : {
            anchorNodeUuid: coords.from.nodeUuid ?? '',
            x: coords.to.x,
            y: coords.to.y
          },
      nodesBCR
    )
  }, [coords.from, coords.to, editing, nodesBCR])

  // sync up snap target to local state
  useEffect(() => {
    if (
      (snapTarget && !snapTo) ||
      (!snapTarget && snapTo) ||
      snapTarget?.nodeUuid !== snapTo?.nodeUuid
    ) {
      setSnapTo(snapTarget)
    }
  }, [snapTo, snapTarget])

  // dispatch the action only when things actually change
  useEffect(() => {
    const nodeUuid = snapTo?.nodeUuid ?? null
    const edge = snapTo?.edge ?? null
    if (nodeUuid && edge) {
      dispatch(
        svglinkDragSnap({
          uuid: nodeUuid,
          edge,
          editing: editing ?? 'to'
        })
      )
    }
  }, [editing, snapTo, dispatch])

  if (!coords.from || !coords.to) {
    return null
  }

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

  return <path d={path} stroke="#FCD748" strokeWidth="2" fill="none" />
}

export default DrawPreview
