export type ConnectionEdge = 'top' | 'right' | 'bottom' | 'left'

export type ConnectionTargetType = [number, ConnectionEdge]

export type ConnectionType = {
  from: ConnectionTargetType
  to: ConnectionTargetType
}
