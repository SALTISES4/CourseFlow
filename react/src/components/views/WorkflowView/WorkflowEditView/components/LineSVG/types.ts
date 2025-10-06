export const edgeKeys = ['top', 'right', 'bottom', 'left'] as const

export type ConnectionEdge = (typeof edgeKeys)[number]

export type ConnectionTargetType = [number, ConnectionEdge]

export type ConnectionType = {
  id: number
  from: ConnectionTargetType
  to: ConnectionTargetType
  offset?: {
    from: { x: number; y: number }
    to: { x: number; y: number }
  }
}
