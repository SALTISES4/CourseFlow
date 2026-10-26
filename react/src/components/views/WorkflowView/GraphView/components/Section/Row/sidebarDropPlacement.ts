import type {
  GridDropEdge,
  GridInsertMode
} from '@cf/features/graph/state/model/types'

export type SidebarDropTargetKind = 'empty-cell' | 'occupied-cell'

export type PendingSidebarDrop = {
  channelId: string
  custom: boolean
  row: number | 'empty'
  targetKind: SidebarDropTargetKind
  edge?: GridDropEdge
}

export function resolveSidebarDropPlacement(
  drop: PendingSidebarDrop,
  mode: GridInsertMode
): { rowHint: number; edge?: GridDropEdge } {
  return {
    rowHint: drop.row === 'empty' ? 0 : drop.row,
    edge:
      mode === 'column' && drop.targetKind === 'empty-cell'
        ? undefined
        : drop.edge
  }
}
