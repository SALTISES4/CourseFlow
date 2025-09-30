import {
  makeSelectColumnsForWorkflow,
  selectColumnById
} from '@cf/redux/selectors/column.selector'
import { TColumn, TWorkflow } from '@cf/redux/types/type'
import { DraggableType } from '@cfViews/WorkflowView/WorkflowEditView/types'
import { getColumnColors } from '@cfViews/WorkflowView/WorkflowEditView/utility'

import { AddTabType } from '../../types'

type ColumnNodeDataType = {
  id: number
  title: string
  color: string
}

// Prepare the workflow node categories (columns) data
// @todo his is probably wrong
export function getColumnData(columns: TColumn[]): ColumnNodeDataType[] {
  const colors = getColumnColors(columns)

  return columns.map((column, index) => ({
    id: column.id,
    title: column.title ?? column.columnTypeDisplay,
    color: colors[index]
  }))
}

const data: AddTabType = {
  title: 'Add to workflow',
  subtitle: 'Drag and drop to add nodes.',
  groups: [
    {
      type: DraggableType.REUSABLE,
      title: 'Reusable blocks',
      blocks: [
        {
          id: 1,
          label: 'Block 1'
        },
        {
          id: 2,
          label: 'Block 2'
        },
        {
          id: 3,
          label: 'Block 3'
        }
      ]
    },
    {
      type: DraggableType.STRATEGIES,
      title: 'Strategies',
      blocks: [
        {
          id: 1,
          label: 'Jigsaw'
        },
        {
          id: 2,
          label: 'Peer instruction'
        },
        {
          id: 3,
          label: 'Toolkit'
        },
        {
          id: 4,
          label: 'Case studies'
        },
        {
          id: 5,
          label: 'Gallery walk'
        },
        {
          id: 6,
          label: 'Reflective writing'
        },
        {
          id: 7,
          label: 'Two stage exam'
        }
      ]
    }
  ]
}

export default data
