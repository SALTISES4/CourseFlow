import { TColumn } from '@cf/redux/types/type'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { DraggableType } from '@cfViews/WorkflowView/WorkflowEditView/types'

import { AddTabType } from '../../types'

// Prepare the workflow node categories (columns) data
export function getColumnData(columns: TColumn[]) {
  return columns.map((column) => ({
    id: column.id,
    title: column.title ?? column.columnTypeDisplay,
    color: ThemeHelper.getColumnColour({
      columnType: column.columnType,
      colour: column.colour
    })
  }))
}

const data: AddTabType = {
  title: 'Add to workflow',
  subtitle: 'Drag and drop to add nodes.',
  groups: [
    {
      type: DraggableType.SIDEBAR_REUSABLE,
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
      type: DraggableType.SIDEBAR_STRATEGY,
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
