import { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import {
  NodeInsertMode,
  NodeWorkflowReorderPayload
} from '@cf/redux/slices/node.slice'
import {
  CellClickCallbackFn,
  CellReorderCallbackFn
} from '@cfViews/WorkflowView/WorkflowEditView/types'
import { MutableRefObject } from 'react'

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
  highlight?: Edge | 'cell'
}

export type WeekCellProps = WeekCellPhantomType | WeekCellNodeType

export interface WeekCellPhantomType extends WeekCellShared {
  type: WeekCellType.PHANTOM
  emptyRow?: boolean
}

export interface WeekCellNodeType extends WeekCellShared {
  nodeId: number
  type: WeekCellType.NODE
  onClick: CellClickCallbackFn
}

interface InternalShared {
  wrapRef: MutableRefObject<HTMLDivElement>
  onDrop: (
    data: NodeWorkflowReorderPayload & {
      type: WeekCellType.NODE | WeekCellType.PHANTOM
    }
  ) => void
}

export interface WeekCellPhantomTypeInternal
  extends WeekCellPhantomType,
    InternalShared {
  insertMode: NodeInsertMode
}

export interface WeekCellNodeTypeTypeInternal
  extends WeekCellNodeType,
    InternalShared {}
