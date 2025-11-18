import { NodeWorkflowReorderPayload } from '@cf/redux/slices/node.slice'
import { MouseEvent } from 'react'

export enum DraggableType {
  COLUMN = 'column',
  CELL = 'cell',
  WEEK = 'week',
  REUSABLE = 'reusable',
  STRATEGIES = 'strategies'
}

export enum DroppableType {
  ROW = 'row'
}

export type CellDataType = {
  id: number
  coords: {
    week: number
    x: number // column
    y: number // row
  }
  type: DraggableType
}

type RowDataType = {
  coords: {
    week: number
    y: number
  }
  type: DroppableType
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
  nodeId: number
) => void

// simple typeguards for better draggable data typing
export function isGridWeek(
  data: Record<string | symbol, unknown>
): data is WeekDataType {
  return 'index' in data && 'type' in data && data.type === DraggableType.WEEK
}

export function isGridRow(
  data: Record<string | symbol, unknown>
): data is RowDataType {
  return 'coords' in data && 'type' in data && data.type === DroppableType.ROW
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

type BoardWeekType = {
  id: number
}

export function isSidebarPart(
  data: Record<string | symbol, unknown>
): data is BoardWeekType {
  return (
    'id' in data &&
    (data.type === DraggableType.REUSABLE ||
      data.type === DraggableType.STRATEGIES)
  )
}
