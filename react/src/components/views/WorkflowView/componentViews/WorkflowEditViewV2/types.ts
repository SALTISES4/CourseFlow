export type BoardPhantomNodeType = 'phantom'

export type BoardNodeType = {
  id: number
  title: string
  description: string
  column: number
}

export type BoardWeekRowType = (BoardPhantomNodeType | BoardNodeType)[]

type BoardWeekType = {
  id: number
  rows: BoardWeekRowType[]
}

export type BoardType = BoardWeekType[]

export enum DraggableType {
  COLUMN = 'column',
  CELL = 'cell'
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

export type RowReorderCallbackFn = (
  from: RowDataType['coords'],
  to: RowDataType['coords']
) => void

export type CellReorderCallbackFn = (
  coords: CellDataType['coords'],
  newIndex: number
) => void

// simple typeguard for better draggable data typing
export function isGridRow(
  data: Record<string | symbol, unknown>
): data is RowDataType {
  return 'coords' in data && 'type' in data && data.type === DroppableType.ROW
}

// simple typeguard for better draggable data typing
export function isGridCell(
  data: Record<string | symbol, unknown>
): data is CellDataType {
  return 'coords' in data && 'type' in data && data.type === DraggableType.CELL
}
