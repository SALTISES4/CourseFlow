import { MouseEvent, ReactNode } from 'react'

import { BoardNodeDataType, CellDataType } from '../../types'

export enum WeekCellNodeType {
  PHANTOM = 'phantom',
  NODE = 'node'
}

export type SharedProps = {
  coords: CellDataType['coords']
  borderColor: string
}

export type PhantomPropsType = SharedProps & {
  type: WeekCellNodeType.PHANTOM
  onReorder: (coords: CellDataType['coords'], newIndex: number) => void
}

export type NodePropsType = SharedProps &
  Pick<
    BoardNodeDataType,
    | 'id'
    | 'outgoingLinks'
    | 'hasAutoLink'
    | 'contextType'
    | 'taskType'
    | 'time'
    | 'linkedOutcomes'
  > & {
    type: WeekCellNodeType.NODE
    title: string | ReactNode
    description: string | ReactNode
    onClick: (e: MouseEvent<HTMLDivElement>) => void
  }
