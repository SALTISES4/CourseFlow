import { CfObjectType } from '@cf/types/enum'
import { TWeek } from '@cf/types/week'
import { nodeChangeField } from '@cfRedux/slices/node.slice'
import { weekChangeField } from '@cfRedux/slices/week.slice'
import { AppState } from '@cfRedux/types/type'
import { ThunkAction } from '@reduxjs/toolkit'
import { AnyAction } from 'redux'

export const updateAllEntities =
  (
    type: CfObjectType,
    updateFn: (item: TWeek) => Partial<TWeek>
  ): ThunkAction<void, AppState, unknown, AnyAction> =>
  (dispatch, getState) => {
    switch (type) {
      case CfObjectType.NODE:
        const currentNodes = getState().node

        if (!Array.isArray(currentNodes)) {
          console.error('Error: state.week is not an array', currentWeeks)
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

      case CfObjectType.WEEK:
        const currentWeeks = getState().week

        // Ensure currentWeeks is an array before proceeding
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
