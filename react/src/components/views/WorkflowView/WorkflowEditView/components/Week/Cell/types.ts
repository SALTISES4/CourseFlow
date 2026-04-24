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
  coordsWeek: string
  coordsX: number
  coordsY: number
  borderColor: string
  columnId: string
  onReorder: CellReorderCallbackFn
  highlight?: Edge | 'cell'
}

export type WeekCellProps = WeekCellEmptyType | WeekCellNodeType

export interface WeekCellEmptyType extends WeekCellShared {
  type: WeekCellType.PHANTOM
  emptyRow?: boolean
}

export interface WeekCellNodeType extends WeekCellShared {
  nodeId: string
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

export interface WeekCellEmptyTypeInternal
  extends WeekCellEmptyType,
    InternalShared {}

export interface WeekCellNodeTypeTypeInternal
  extends WeekCellNodeType,
    InternalShared {}
