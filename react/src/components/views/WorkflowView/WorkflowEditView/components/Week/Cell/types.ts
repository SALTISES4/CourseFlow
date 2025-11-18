import { CellClickCallbackFn, CellReorderCallbackFn } from '../../../types'

export enum WeekCellNodeType {
  PHANTOM = 'phantom',
  NODE = 'node'
}

export type SharedProps = {
  coordsWeek: number
  coordsX: number
  coordsY: number
  borderColor: string
  columnId: number
  onReorder: CellReorderCallbackFn
}

export type PhantomPropsType = SharedProps & {
  type: WeekCellNodeType.PHANTOM
}

export type NodePropsType = SharedProps & {
  nodeId: number
  type: WeekCellNodeType.NODE
  onClick: CellClickCallbackFn
}
