/** How the graph editor inserts/moves nodes when dropping on the grid. */
export type NodeInsertMode = 'manual' | 'row' | 'column'

export type NodeDropPayload = {
  mode?: NodeInsertMode
  edge?: 'top' | 'bottom'
  uuid: string
  /** Section UUID (legacy field name `fromSection`). */
  fromSection: string
  /** Section UUID (legacy field name `toSection`). */
  toSection: string
  /** Channel UUID (legacy field name `toColumn`). */
  toColumn: string
  toRow: number
}

/**
 * Target `sectionRow` for a grid drop before calling `moveNode`.
 * Ported from legacy `workflowNodeReorder` row resolution (insert modes only).
 */
export function resolveNodeDropSectionRow(
  payload: Pick<NodeDropPayload, 'mode' | 'edge' | 'toRow'>,
  insertMode: NodeInsertMode = 'manual'
): number {
  const { mode, edge, toRow } = payload
  const effectiveMode = mode ?? insertMode

  if (effectiveMode === 'column') {
    if (!edge) {
      return toRow
    }
    return edge === 'top' ? Math.max(0, toRow - 1) : toRow + 1
  }

  if (effectiveMode === 'row') {
    return edge === 'bottom' ? toRow + 1 : toRow
  }

  return toRow
}
