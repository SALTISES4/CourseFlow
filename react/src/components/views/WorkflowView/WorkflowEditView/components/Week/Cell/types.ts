import { NodeInsertMode } from '@cf/redux/slices/node.slice'
import { MutableRefObject } from 'react'

import { CellClickCallbackFn, CellReorderCallbackFn } from '../../../types'

export enum WeekCellType {
  PHANTOM = 'phantom',
  NODE = 'node'
}

interface WeekCellShared {
  coordsWeek: number
  coordsX: number
  coordsY: number
  borderColor: string
  columnId: number
  onReorder: CellReorderCallbackFn
}

export type WeekCellProps = WeekCellPhantomType | WeekCellNodeType

export interface WeekCellPhantomType extends WeekCellShared {
  type: WeekCellType.PHANTOM
}

export interface WeekCellNodeType extends WeekCellShared {
  nodeId: number
  type: WeekCellType.NODE
  onClick: CellClickCallbackFn
}

interface InternalShared {
  wrapRef: MutableRefObject<HTMLDivElement>
  onDrop: () => void
}

export interface WeekCellPhantomTypeInternal
  extends WeekCellPhantomType,
    InternalShared {
  insertMode: NodeInsertMode
}

export interface WeekCellNodeTypeTypeInternal
  extends WeekCellNodeType,
    InternalShared {}
