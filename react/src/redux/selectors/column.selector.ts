import { columnAdapter } from '@cfRedux/slices/column.slice'
import { RootState } from '@cfRedux/store'
import { createSelector } from 'reselect'

export const {
  selectEntities: selectColumnEntities,
  selectAll: selectAllColumns,
  selectById: selectColumnById,
  selectIds: selectColumnIds
} = columnAdapter.getSelectors<RootState>((state) => state.workspace.column)

const selectWorkflowColumnIds = (state: RootState) =>
  state.workspace.workflow.columns

export const selectWorkflowColumns = createSelector(
  [selectWorkflowColumnIds, selectColumnEntities],
  (columnIds, entities) => columnIds.map((id) => entities[id]).filter(Boolean)
)
