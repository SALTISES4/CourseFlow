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

export type CellReorderCallbackFn = (
  coords: CellDataType['coords'],
  newIndex: number
) => void
