import { RootState } from '@cfRedux/store'

import { weekAdapter } from '../slices/week.slice'

export const {
  selectAll: selectAllWeeks,
  selectById: selectWeekById,
  selectIds: selectWeekIds
} = weekAdapter.getSelectors<RootState>((state) => state.workspace.week)
