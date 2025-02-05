export type BoardNodeType =
  | 'phantom'
  | {
      id: number
      title: string
      description: string
      column: number
    }

export type BoardWeekRowType = BoardNodeType[]

type BoardWeekType = {
  id: number
  rows: BoardWeekRowType[]
}

export type BoardType = BoardWeekType[]

export enum DraggableType {
  COLUMN = 'column',
  CELL = 'cell'
}

export type CellDataType = {
  coords: {
    week: number
    x: number // column
    y: number // row
  }
  type: DraggableType
}

type RowCords = {
  weekId: number
  y: number
}

export type RowReorderCallbackFn = (from: RowCords, to: RowCords) => void

export type CellReorderCallbackFn = (
  coords: CellDataType['coords'],
  newIndex: number
) => void

// simple typeguard for better draggable data typing
export function hasCoords(
  data: Record<string | symbol, unknown>
): data is CellDataType {
  return 'coords' in data
}
