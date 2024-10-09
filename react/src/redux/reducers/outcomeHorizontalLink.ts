import {
  CommonActions,
  OutcomeHorizontalLinkActions
} from '@cfRedux/types/enumActions'
import { TOutcomeHorizontalLink } from '@cfRedux/types/type'
import * as Utility from '@cfUtility'
import { AnyAction } from '@reduxjs/toolkit'

function outcomeHorizontalLinkReducer(
  state: TOutcomeHorizontalLink[] = [],
  action: AnyAction
): TOutcomeHorizontalLink[] {
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

      const newOutcomeHorizontalLinkOutcomes = action.payload.dataPackage.map(
        (outcomeHorizontalLink) =>
          Utility.cantorPairing(
            outcomeHorizontalLink.outcome,
            outcomeHorizontalLink.parentOutcome
          )
      )

      let updatedState = state.map((item) => {
        const index = newOutcomeHorizontalLinkOutcomes.indexOf(
          Utility.cantorPairing(item.outcome, item.parentOutcome)
        )
        return index !== -1 ? action.payload.dataPackage[index] : item
      })

      const unusedData = action.payload.dataPackage.filter(
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
