import { CommonActions } from '@cfRedux/types/enumActions'
import { TParentWorkflow } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'

export default function parentWorkflowReducer(
  state: TParentWorkflow[] = [],
  action: AnyAction
): TParentWorkflow[] {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      return action.payload.parentWorkflow || state

    case CommonActions.REFRESH_STOREDATA: {
      if (!action.payload.parentWorkflow) {
        return state
      }

      return action.payload.parentWorkflow.reduce(
        (acc, newItem) => {
          const index = acc.findIndex((item) => item.id === newItem.id)
          if (index > -1) {
            acc.splice(index, 1, newItem)
          } else {
            acc.push(newItem)
          }
          return acc
        },
        [...state]
      )
    }

    default:
      return state
  }
}

// export default function parentWorkflowReducer(state = [], action) {
//   switch (action.type) {
//     case 'replaceStoreData':
//       if (action.payload.parentWorkflow) return action.payload.parentWorkflow
//       return state
//     case 'refreshStoreData':
//       var newState = state.slice()
//       if (action.payload.parentWorkflow) {
//         for (let i = 0; i < action.payload.parentWorkflow.length; i++) {
//           const new_obj = action.payload.parentWorkflow[i]
//           let added = false
//           for (let j = 0; j < newState.length; j++) {
//             if (newState[j].id == new_obj.id) {
//               newState.splice(j, 1, new_obj)
//               added = true
//               break
//             }
//           }
//           if (added) continue
//           newState.push(new_obj)
//         }
//       }
//       return newState
//     default:
//       return state
//   }
// }
