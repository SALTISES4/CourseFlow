import { columnAdapter } from '@cfRedux/slices/column.slice'
import { RootState } from '@cfRedux/store'
import { createSelector } from 'reselect'

export const {
  selectEntities: selectColumnEntities,
  selectAll: selectAllColumns,
  selectById: selectColumnById,
  selectIds: selectColumnIds
} = columnAdapter.getSelectors<RootState>((state) => state.workspace.column)

// Factory keeps memoization per component instance
export const makeSelectColumnsForWorkflow = () =>
  createSelector(
    [
      (s: RootState) => s.workspace.workflow?.columns ?? [],
      selectColumnEntities
    ],
    (columnIds, entities) => columnIds.map((id) => entities[id]).filter(Boolean)
  )
