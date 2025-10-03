import { TNodelink } from '@cf/redux/types/type'

import { ConnectionEdge, edgeKeys } from './types'

// generate line offsets in steps of eg. 5>, starting from 0 and then incrementing by step
// and alternating between positive and negative number, ie
// [0, 5, -5, 10, -10, 15, -15, ...]
// so there's even spacing between all lines sharing the same node edge
export function generateOffsets(edgeLineCount: number, step = 10): number[] {
  const result: number[] = []
  for (let i = 0; i < edgeLineCount; i++) {
    if (i === 0) {
      result.push(0)
    } else {
      const stepValue = Math.ceil(i / 2) * step
      const sign = i % 2 === 1 ? 1 : -1
      result.push(sign * stepValue)
    }
  }
  return result
}

// group node + edge information into easier to work with groups
// so that we can calculate line offsete
// (ie, by knowing how many total lines there are on each of the edges)
export function groupLinksByNodeEdge(links: TNodelink[]) {
  const grouped: Record<string, TNodelink[]> = {}

  links.forEach((link) => {
    const edgeFrom = `${link.sourceNode}-${edgeKeys[link.sourcePort]}`
    const edgeTo = `${link.targetNode}-${edgeKeys[link.targetPort]}`

    if (grouped[edgeFrom] == null) {
      grouped[edgeFrom] = []
    }
    grouped[edgeFrom].push(link)

    if (grouped[edgeTo] == null) {
      grouped[edgeTo] = []
    }
    grouped[edgeTo].push(link)
  })

  return grouped
}

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
