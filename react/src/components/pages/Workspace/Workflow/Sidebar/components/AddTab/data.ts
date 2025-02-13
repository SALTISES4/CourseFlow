import { getColumnColors } from '@cf/components/views/WorkflowView/componentViews/WorkflowEditViewV2/utility'
import { selectColumnById } from '@cf/redux/selectors/column.selector'
import { AppState, TWorkflow } from '@cf/redux/types/type'
import { DraggableType } from '@cfViews/WorkflowView/componentViews/WorkflowEditViewV2/types'
import { useSelector } from 'react-redux'

import { AddTabType } from '../../types'

type NodeCategoriesData = {
  id: number
  title: string
  color: string
}

// Prepare the workflow node categories (columns) data
export function getNodeCategoriesData(
  workflow: TWorkflow
): NodeCategoriesData[] {
  const { columns } = workflow
  const columnData = columns.map((columnId) =>
    useSelector((appState: AppState) => selectColumnById(appState, columnId))
  )
  const colors = getColumnColors(columnData)
  return columnData.map((data, index) => {
    const { column } = data
    const parsed: NodeCategoriesData = {
      id: columns[index],
      title: column.title ?? column.columnTypeDisplay,
      color: colors[index]
    }

    return parsed
  })
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
