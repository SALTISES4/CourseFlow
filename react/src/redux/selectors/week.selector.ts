import Utility from '@cf/utility/Utility.class'
import { TColumnWorkflowById } from '@cfFindState'
import { RootState } from '@cfRedux/store'
import { AppState } from '@cfRedux/types/type'
import { EWorkflow } from '@XMLHTTP/types/entity'

import { weekAdapter } from '../slices/week.slice'

export const getColumnWorkflowById = (
  columnworkflow: AppState['columnworkflow'],
  workflow: EWorkflow,
  id: number
): TColumnWorkflowById => {
  for (const i in columnworkflow) {
    const columnWorkflow = columnworkflow[i]
    if (columnWorkflow.id === id) {
      return {
        data: columnWorkflow,
        order: workflow.columns
      }
    }
  }

  Utility.logger('no columnWorkflow found with id', id)

  // why is this
  return {
    data: undefined,
    order: undefined
  }
}

export const {
  selectAll: selectAllWeeks,
  selectById: selectWeekById,
  selectIds: selectWeekIds
} = weekAdapter.getSelectors<RootState>((state) => state.workspace.week)
