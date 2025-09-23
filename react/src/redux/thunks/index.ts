import { CfObjectType } from '@cf/types/enum'
import { selectAllNodes } from '@cfRedux/selectors/node.selector'
import { selectAllWeeks } from '@cfRedux/selectors/week.selector'
import { updateManyNodes } from '@cfRedux/slices/node.slice'
import { updateManyWeeks } from '@cfRedux/slices/week.slice'
import { RootState } from '@cfRedux/store'
import { TNode, TWeek } from '@cfRedux/types/type'
import { Action, ThunkAction } from '@reduxjs/toolkit'

export const updateAllEntities =
  (
    type: CfObjectType,
    updateFn: (item: TWeek | TNode) => Partial<TWeek>
  ): ThunkAction<void, RootState, unknown, Action> =>
  (dispatch, getState) => {
    const state = getState() // Get the current state
    switch (type) {
      case CfObjectType.NODE: {
        const nodes = selectAllNodes(state)
        const updates = nodes.map((node) => ({
          id: node.id,
          changes: { isDropped: !node.isDropped }
        }))
        dispatch(updateManyNodes(updates))
        break
      }

      case CfObjectType.WEEK: {
        const weeks = selectAllWeeks(state)
        const updates = weeks.map((week) => ({
          id: week.id,
          changes: { isDropped: !week.isDropped }
        }))
        dispatch(updateManyWeeks(updates))
        break
      }
    }
  }
