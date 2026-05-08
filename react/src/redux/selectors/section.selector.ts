import { RootState } from '@cfRedux/store'

import { sectionAdapter } from '../slices/section.slice'

export const {
  selectAll: selectAllSections,
  selectById: selectSectionById,
  selectIds: selectSectionIds
} = sectionAdapter.getSelectors<RootState>((state) => state.workspace.section)
