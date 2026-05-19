import type { GridDropEdge, GridInsertMode } from './model/types'

/** How the graph editor inserts/moves nodes when dropping on the grid. */
export type NodeInsertMode = 'manual' | GridInsertMode

export type NodeDropPayload = {
  mode?: GridInsertMode
  edge?: GridDropEdge
  uuid: string
  /** Section UUID (legacy field name `fromSection`). */
  fromSection: string
  /** Section UUID (legacy field name `toSection`). */
  toSection: string
  /** Channel UUID (legacy field name `toColumn`). */
  toColumn: string
  /** Row index hint for the backend (legacy `toRow`). */
  toRow: number
}
