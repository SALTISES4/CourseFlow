import * as Utility from '@cfUtility'
import { OutcomeHorizontalLink } from '@cfRedux/type'
import { AnyAction } from '@reduxjs/toolkit'
import {
  CommonActions,
  OutcomeHorizontalLinkActions
} from '@cfRedux/enumActions'

function outcomeHorizontalLinkReducer(
  state: OutcomeHorizontalLink[] = [],
  action: AnyAction
): OutcomeHorizontalLink[] {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA: {
      return action.payload.outcomehorizontallink || state
    }

    case CommonActions.REFRESH_STOREDATA:
      if (!action.payload.outcomehorizontallink) {
        return state
      }

      return action.payload.outcomehorizontallink.reduce(
        (updatedState, newOutcomeHorizontalLink) => {
          const existingIndex = updatedState.findIndex(
            (item) => item.id === newOutcomeHorizontalLink.id
          )

          if (existingIndex !== -1) {
            // Replace existing item
            return [
              ...updatedState.slice(0, existingIndex),
              newOutcomeHorizontalLink,
              ...updatedState.slice(existingIndex + 1)
            ]
          } else {
            // Add new item
            return [...updatedState, newOutcomeHorizontalLink]
          }
        },
        [...state]
      )

    case OutcomeHorizontalLinkActions.UPDATE_DEGREE:
      if (action.payload.outcomehorizontallink === -1) return state

      const newOutcomeHorizontalLinkOutcomes = action.payload.data_package.map(
        (outcomeHorizontalLink) =>
          Utility.cantorPairing(
            outcomeHorizontalLink.outcome,
            outcomeHorizontalLink.parent_outcome
          )
      )

      let updatedState = state.map((item) => {
        const index = newOutcomeHorizontalLinkOutcomes.indexOf(
          Utility.cantorPairing(item.outcome, item.parent_outcome)
        )
        return index !== -1 ? action.payload.data_package[index] : item
      })

      const unusedData = action.payload.data_package.filter(
        (data) => !updatedState.includes(data)
      )
      updatedState = [...updatedState, ...unusedData].filter(
        (outcomeHorizontalLink) => outcomeHorizontalLink.degree > 0
      )

      return updatedState

    default:
      return state
  }
}

export default outcomeHorizontalLinkReducer
