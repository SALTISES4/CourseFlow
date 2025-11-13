import { columnAdapter } from '@cfRedux/slices/column.slice'
import { RootState } from '@cfRedux/store'

export const {
  selectEntities: selectColumnEntities,
  selectAll: selectAllColumns,
  selectById: selectColumnById,
  selectIds: selectColumnIds
} = columnAdapter.getSelectors<RootState>((state) => state.workspace.column)
