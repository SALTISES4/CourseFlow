import { ConnectionEdge, edgeKeys } from './types'

type PositionCoords = {
  x: number
  y: number
}

// get coordinates for each of the edges according to node's boundingClientRect()
export function getCoords(
  bcr: DOMRect,
  direction: ConnectionEdge
): PositionCoords {
  const { left, right, top, bottom, width, height } = bcr
  const posX = left + width / 2
  const posY = top + height / 2

  const positions: Record<ConnectionEdge, PositionCoords> = {
    left: { x: left, y: posY },
    right: { x: right, y: posY },
    top: { x: posX, y: top },
    bottom: { x: posX, y: bottom }
  }

  return positions[direction]
}

/**
 * Map canonical API port strings (indices or cardinal names) to SVG connection edges.
 */
export function canonicalPortToConnectionEdge(port: string): ConnectionEdge {
  const trimmed = port.trim()
  const asNum = Number(trimmed)
  if (!Number.isNaN(asNum) && asNum >= 0 && asNum < edgeKeys.length) {
    return edgeKeys[asNum]
  }
  const lower = trimmed.toLowerCase()
  if (lower === 'north' || lower === 'top' || lower === 'n') {
    return 'top'
  }
  if (lower === 'east' || lower === 'right' || lower === 'e') {
    return 'right'
  }
  if (lower === 'south' || lower === 'bottom' || lower === 's') {
    return 'bottom'
  }
  if (lower === 'west' || lower === 'left' || lower === 'w') {
    return 'left'
  }
  return edgeKeys.includes(trimmed as ConnectionEdge)
    ? (trimmed as ConnectionEdge)
    : 'right'
}

/** Dashed stroke from canonical graph `lineType` until a dedicated enum exists in the API client. */
export function edgeLineTypeIsDashed(lineType: string): boolean {
  const t = lineType.toLowerCase()
  return t.includes('dash') || t === 'dotted' || t === 'dashed'
}
