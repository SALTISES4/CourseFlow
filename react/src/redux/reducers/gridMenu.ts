import { GridMenuActions } from '@cfRedux/types/enumActions'
import { AnyAction } from '@reduxjs/toolkit'
type GridMenu = any

export default function gridMenuReducer(
  state: GridMenu = {},
  action: AnyAction
) {
  switch (action.type) {
    case GridMenuActions.ITEM_ADDED:
      // Create a deep copy of the relevant part of the state
      const newState = {
        ...state,
        owned_strategies: { ...state.owned_strategies },
        ownedProjects: { ...state.ownedProjects }
      }

      // Determine which part of the state to update
      const target =
        action.payload.type === 'project'
          ? 'ownedProjects'
          : 'owned_strategies'

      // Deep copy the sections to maintain immutability
      newState[target].sections = newState[target].sections.map(
        (section) => ({
          ...section,
          objects:
            section.objectType === action.payload.type
              ? [...section.objects, action.payload.newItem]
              : [...section.objects]
        })
      )

      return newState

    default:
      return state
  }
}

// export default function gridMenuReducer(state = {}, action) {
//   switch (action.type) {
//     case GridMenuActions.ITEM_ADDED:
//       var newState = { ...state } // @todo why the shallow copy here?
//       if (action.payload.type !== 'project') {
//         newState.owned_strategies = { ...newState.owned_strategies }
//         newState.owned_strategies.sections =
//           newState.owned_strategies.sections.slice()
//         for (var i = 0; i < newState.ownedProjects.sections.length; i++) {
//           if (
//             newState.owned_strategies.sections[i].objectType ==
//             action.payload.type
//           ) {
//             newState.owned_strategies.sections[i].objects =
//               newState.owned_strategies.sections[i].objects.slice()
//             newState.owned_strategies.sections[i].objects.push(
//               action.payload.newItem
//             )
//           }
//         }
//       } else {
//         newState.ownedProjects = { ...newState.ownedProjects }
//         newState.ownedProjects.sections =
//           newState.ownedProjects.sections.slice()
//         for (var i = 0; i < newState.ownedProjects.sections.length; i++) {
//           if (
//             newState.ownedProjects.sections[i].objectType ==
//             action.payload.type
//           ) {
//             newState.ownedProjects.sections[i].objects =
//               newState.ownedProjects.sections[i].objects.slice()
//             newState.ownedProjects.sections[i].objects.push(
//               action.payload.newItem
//             )
//           }
//         }
//       }
//       return newState
//     default:
//       return state
//   }
// }
