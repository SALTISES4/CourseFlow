import type { NodeDropPayload } from '@cf/features/graph/state/resolveNodeDropRow'
import { MouseEvent } from 'react'

export enum DraggableType {
  // draggables from the workflow view grid
  COLUMN = 'column',
  CELL = 'cell',
  WEEK = 'section',

  // draggables from the sidebar Add tab
  SIDEBAR_NODE = 'sidebar node',
  SIDEBAR_NODE_CUSTOM = 'sidebar node custom',
  SIDEBAR_REUSABLE = 'reusable',
  SIDEBAR_STRATEGY = 'strategy'
}

export type CellDataType = {
  uuid: string
  coords: {
    section: string
    x: number // column index
    y: number // row
  }
  type: DraggableType
}

type SectionDataType = {
  index: number
  type: DraggableType
}

export type ColumnReorderCallbackFn = (
  oldIndex: number,
  newIndex: number
) => void

export type SectionInsertCallbackFn = (insertAt: number) => void
export type SectionReorderCallbackFn = (from: number, to: number) => void

export type CellReorderCallbackFn = (payload: NodeDropPayload) => void

export type CellClickCallbackFn = (
  e: MouseEvent<HTMLDivElement>,
  nodeuuid: string
) => void

// simple typeguards for better draggable data typing
export function isGridSection(
  data: Record<string | symbol, unknown>
): data is SectionDataType {
  return 'index' in data && 'type' in data && data.type === DraggableType.WEEK
}

export function isGridCell(
  data: Record<string | symbol, unknown>
): data is CellDataType {
  return (
    'uuid' in data &&
    'coords' in data &&
    'type' in data &&
    data.type === DraggableType.CELL
  )
}

export function isSidebarNode(data: Record<string | symbol, unknown>): data is {
  uuid: string
  type: DraggableType.SIDEBAR_NODE | DraggableType.SIDEBAR_NODE_CUSTOM
} {
  return (
    'uuid' in data &&
    'type' in data &&
    (data.type === DraggableType.SIDEBAR_NODE ||
      data.type === DraggableType.SIDEBAR_NODE_CUSTOM)
  )
}

export function isSidebarCustomNode(
  data: Record<string | symbol, unknown>
): data is {
  uuid: string
  type: DraggableType.SIDEBAR_NODE_CUSTOM
} {
  return isSidebarNode(data) && data.type === DraggableType.SIDEBAR_NODE_CUSTOM
}

export function isSidebarPart(data: Record<string | symbol, unknown>): data is {
  uuid: string
} {
  return (
    'uuid' in data &&
    (data.type === DraggableType.SIDEBAR_REUSABLE ||
      data.type === DraggableType.SIDEBAR_STRATEGY)
  )
}
