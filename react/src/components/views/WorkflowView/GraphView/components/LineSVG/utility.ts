import { ConnectionEdge } from './types'

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
