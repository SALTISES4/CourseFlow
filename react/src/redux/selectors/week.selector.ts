import Utility from '@cf/utility/Utility.class'
import { TColumnWorkflowById } from '@cfFindState'
import { RootState } from '@cfRedux/store'
import { AppState, WorkspaceAppState } from '@cfRedux/types/type'
import { EWorkflow } from '@XMLHTTP/types/entity'
import { createSelector } from 'reselect'

import { weekAdapter } from '../slices/week.slice'

const selectId = (_: AppState, id: number) => id
const selectWeeks = (state: AppState) => state.workspace.week
const selectWorkflow = (state: AppState) => state.workspace.workflow
const selectColumnWorkflow = (state: AppState) => state.columnworkflow

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
// @todo why are weeks and terms handled differently
// export const selectWeekById = createSelector(
//   [selectId, selectWeeks, selectWorkflow, selectColumnWorkflow],
//   (id, weeks, workflow, columnworkflow) => {
//     const week = weeks.find((w) => w.id === id)
//
//     if (!week) {
//       Utility.logger('No week found with id', id)
//       return undefined
//     }
//
//     return {
//       week,
//       columns: workflow.columns.map((columnId) => {
//         const columnWorkflow = getColumnWorkflowById(
//           columnworkflow,
//           workflow,
//           columnId
//         )
//         return columnWorkflow?.data?.column
//       }),
//       workflowId: workflow.id
//     }
//   }
// )

export const {
  selectAll: selectAllWeeks,
  selectById: selectWeekById,
  selectIds: selectWeekIds
  // ... other selectors if needed
} = weekAdapter.getSelectors<RootState>((state) => state.workspace.week)
