import { objectSetAdapter } from '@cfRedux/slices/objectSet.slice'
import { RootState } from '@cfRedux/store'

export const {
  selectAll: selectAllObjectSets,
  selectById: selectObjectSetById,
  selectIds: selectObjectSetIds
} = objectSetAdapter.getSelectors<RootState>(
  (state) => state.workspace.objectSet
)
