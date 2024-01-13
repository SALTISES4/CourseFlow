import { CommonActions } from '@cfRedux/enumActions'
import { ParentWorkflow } from '@cfRedux/type'
import { AnyAction } from '@reduxjs/toolkit'

export default function parentWorkflowReducer(
  state: ParentWorkflow[] = [],
  action: AnyAction
): ParentWorkflow[] {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      return action.payload.parent_workflow || state

    case CommonActions.REFRESH_STOREDATA: {
      if (!action.payload.parent_workflow) {
        return state
      }

      return action.payload.parent_workflow.reduce(
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
//       if (action.payload.parent_workflow) return action.payload.parent_workflow
//       return state
//     case 'refreshStoreData':
//       var new_state = state.slice()
//       if (action.payload.parent_workflow) {
//         for (let i = 0; i < action.payload.parent_workflow.length; i++) {
//           const new_obj = action.payload.parent_workflow[i]
//           let added = false
//           for (let j = 0; j < new_state.length; j++) {
//             if (new_state[j].id == new_obj.id) {
//               new_state.splice(j, 1, new_obj)
//               added = true
//               break
//             }
//           }
//           if (added) continue
//           new_state.push(new_obj)
//         }
//       }
//       return new_state
//     default:
//       return state
//   }
// }
