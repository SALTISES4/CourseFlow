import { NodeWorkflowReorderPayload } from '@cf/redux/slices/node.slice'
import { MouseEvent } from 'react'

export enum DraggableType {
  // draggables from the workflow view grid
  COLUMN = 'column',
  CELL = 'cell',
  WEEK = 'week',

  // draggables from the sidebar Add tab
  SIDEBAR_NODE = 'sidebar node',
  SIDEBAR_NODE_CUSTOM = 'sidebar node custom',
  SIDEBAR_REUSABLE = 'reusable',
  SIDEBAR_STRATEGY = 'strategy'
}

export type CellDataType = {
  id: string
  coords: {
    week: number
    x: number // column
    y: number // row
  }
  type: DraggableType
}

type WeekDataType = {
  index: number
  type: DraggableType
}

export type ColumnReorderCallbackFn = (
  oldIndex: number,
  newIndex: number
) => void

export type WeekInsertCallbackFn = (insertAt: number) => void
export type WeekReorderCallbackFn = (from: number, to: number) => void

export type CellReorderCallbackFn = (
  payload: NodeWorkflowReorderPayload
) => void

export type CellClickCallbackFn = (
  e: MouseEvent<HTMLDivElement>,
  nodeid: string
) => void

// simple typeguards for better draggable data typing
export function isGridWeek(
  data: Record<string | symbol, unknown>
): data is WeekDataType {
  return 'index' in data && 'type' in data && data.type === DraggableType.WEEK
}

export function isGridCell(
  data: Record<string | symbol, unknown>
): data is CellDataType {
  return (
    'id' in data &&
    'coords' in data &&
    'type' in data &&
    data.type === DraggableType.CELL
  )
}

export function isSidebarNode(data: Record<string | symbol, unknown>): data is {
  id: string
  type: DraggableType.SIDEBAR_NODE | DraggableType.SIDEBAR_NODE_CUSTOM
} {
  return (
    'id' in data &&
    'type' in data &&
    (data.type === DraggableType.SIDEBAR_NODE ||
      data.type === DraggableType.SIDEBAR_NODE_CUSTOM)
  )
}

export function isSidebarCustomNode(
  data: Record<string | symbol, unknown>
): data is {
  id: string
  type: DraggableType.SIDEBAR_NODE_CUSTOM
} {
  return isSidebarNode(data) && data.type === DraggableType.SIDEBAR_NODE_CUSTOM
}

export function isSidebarPart(data: Record<string | symbol, unknown>): data is {
  id: string
} {
  return (
    'id' in data &&
    (data.type === DraggableType.SIDEBAR_REUSABLE ||
      data.type === DraggableType.SIDEBAR_STRATEGY)
  )
}
