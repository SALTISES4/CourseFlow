import { MouseEvent } from 'react'

import { CellReorderCallbackFn } from '../../../types'

export enum WeekCellNodeType {
  PHANTOM = 'phantom',
  NODE = 'node'
}

export type SharedProps = {
  coordsWeek: number
  coordsX: number
  coordsY: number
  borderColor: string
}

export type PhantomPropsType = SharedProps & {
  type: WeekCellNodeType.PHANTOM
  onReorder: CellReorderCallbackFn
}

export type NodePropsType = SharedProps & {
  nodeId: number
  type: WeekCellNodeType.NODE
  onClick: (e: MouseEvent<HTMLDivElement>) => void
}
