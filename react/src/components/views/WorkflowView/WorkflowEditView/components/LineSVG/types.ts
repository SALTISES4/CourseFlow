export const edgeKeys = ['top', 'right', 'bottom', 'left'] as const

export type ConnectionEdge = (typeof edgeKeys)[number]

export type ConnectionTargetType = [number, ConnectionEdge]

type ConnectionOffsetType = {
  x: number
  y: number
}

export type ConnectionType = {
  id: number
  from: ConnectionTargetType
  to: ConnectionTargetType
  offset?: ConnectionOffsetType
}
