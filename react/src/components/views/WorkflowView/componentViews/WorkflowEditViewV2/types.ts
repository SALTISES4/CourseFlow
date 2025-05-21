import { WeekCellNodeType } from './components/WeekCell/types'

export type BoardNodeDataType = {
  id: number
  title: string
  description: string
  column: number
  hasAutoLink: boolean
  outgoingLinks: number[]
  contextType: number
  taskType: number
  time: {
    length: number
    unit: number
  }
}

export type BoardWeekRowType = (WeekCellNodeType.PHANTOM | BoardNodeDataType)[]

type BoardWeekType = {
  id: number
  rows: BoardWeekRowType[]
}

export type BoardType = BoardWeekType[]

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

export type RowReorderCallbackFn = (
  from: RowDataType['coords'],
  to: RowDataType['coords']
) => void

export type CellReorderCallbackFn = (
  coords: CellDataType['coords'],
  newIndex: number
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
  return 'coords' in data && 'type' in data && data.type === DraggableType.CELL
}

export function isSidebarPart(
  data: Record<string | symbol, unknown>
): data is BoardWeekType {
  return (
    'id' in data &&
    'rows' in data &&
    (data.type === DraggableType.REUSABLE ||
      data.type === DraggableType.STRATEGIES)
  )
}
