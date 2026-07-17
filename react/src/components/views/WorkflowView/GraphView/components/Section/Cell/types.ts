import { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import type {
  NodeDropPayload,
  NodeInsertMode
} from '@cf/features/graph/state/resolveNodeDropRow'
import { RefObject } from 'react'

import { CellClickCallbackFn, CellReorderCallbackFn } from '../../../types'

export enum SectionCellType {
  PHANTOM = 'phantom',
  NODE = 'node'
}

interface SectionCellShared {
  coordsSection: string
  coordsX: number
  coordsY: number
  borderColor: string
  columnId: string
  onReorder: CellReorderCallbackFn
  highlight?: Edge | 'cell'
}

export type SectionCellProps = SectionCellEmptyType | SectionCellNodeType

export interface SectionCellEmptyType extends SectionCellShared {
  type: SectionCellType.PHANTOM
  emptyRow?: boolean
}

export interface SectionCellNodeType extends SectionCellShared {
  nodeId: string
  graphUuid: string
  type: SectionCellType.NODE
  onClick: CellClickCallbackFn
}

interface InternalShared {
  wrapRef: RefObject<HTMLDivElement>
  onDrop: (
    data: NodeDropPayload & {
      type: SectionCellType.NODE | SectionCellType.PHANTOM
    }
  ) => void
}

export interface SectionCellEmptyTypeInternal
  extends SectionCellEmptyType,
    InternalShared {}

export interface SectionCellNodeTypeTypeInternal
  extends SectionCellNodeType,
    InternalShared {}
