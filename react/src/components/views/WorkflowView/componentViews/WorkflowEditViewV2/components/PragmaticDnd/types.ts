export enum DRAGGABLE_TYPE {
  COLUMN = 'column',
  CELL = 'cell'
}

export type CellDataType = {
  coords: {
    week: number
    x: number // column
    y: number // row
  }
  type: DRAGGABLE_TYPE
}

export type CellReorderCallbackFn = (
  coords: CellDataType['coords'],
  newIndex: number
) => void
