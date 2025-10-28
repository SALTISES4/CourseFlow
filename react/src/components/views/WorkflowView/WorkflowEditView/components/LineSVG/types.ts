export const edgeKeys = ['top', 'right', 'bottom', 'left'] as const

// because portkeys are [north = 0, east = 1, south = 2, west = 3]
export const getEdgePortKey = (e: ConnectionEdge) => {
  return edgeKeys.indexOf(e)
}

export type ConnectionEdge = (typeof edgeKeys)[number]

export type ConnectionTargetType = [number, ConnectionEdge]

export type ConnectionType = {
  id: number
  from: ConnectionTargetType
  to: ConnectionTargetType
}
