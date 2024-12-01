import { CfObjectType } from '@cf/types/enum'
import { nodeChangeField } from '@cfRedux/slices/node.slice'
import { weekChangeField } from '@cfRedux/slices/week.slice'
import { AppState, TNode, TWeek } from '@cfRedux/types/type'
import { ThunkAction } from '@reduxjs/toolkit'
import { AnyAction } from 'redux'

export const updateAllEntities =
  (
    type: CfObjectType,
    updateFn: (item: TWeek | TNode) => Partial<TWeek>
  ): ThunkAction<void, AppState, unknown, AnyAction> =>
  (dispatch, getState) => {
    switch (type) {
      case CfObjectType.NODE: {
        const currentNodes = getState().workspace.node

        if (!Array.isArray(currentNodes)) {
          return
        }

        currentNodes.forEach((item) => {
          const updatedData = updateFn(item)
          if (Object.keys(updatedData).length > 0) {
            dispatch(
              nodeChangeField({
                id: item.id,
                data: updatedData
              })
            )
          }
        })
        break
      }

      case CfObjectType.WEEK: {
        const currentWeeks = getState().workspace.week

        if (!Array.isArray(currentWeeks)) {
          console.error('Error: state.week is not an array', currentWeeks)
          return
        }

        currentWeeks.forEach((item) => {
          const updatedData = updateFn(item)
          if (Object.keys(updatedData).length > 0) {
            dispatch(
              weekChangeField({
                id: item.id,
                data: updatedData
              })
            )
          }
        })
        break
      }
    }
  }
