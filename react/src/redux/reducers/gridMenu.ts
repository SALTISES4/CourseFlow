// @ts-nocheck
import { GridMenuActions } from '@cfRedux/enumActions'
import { AnyAction } from '@reduxjs/toolkit'
type GridMenu = any

export default function gridMenuReducer(
  state: GridMenu = {},
  action: AnyAction
) {
  switch (action.type) {
    case GridMenuActions.ITEM_ADDED:
      // Create a deep copy of the relevant part of the state
      const new_state = {
        ...state,
        owned_strategies: { ...state.owned_strategies },
        owned_projects: { ...state.owned_projects }
      }

      // Determine which part of the state to update
      const target =
        action.payload.type === 'project'
          ? 'owned_projects'
          : 'owned_strategies'

      // Deep copy the sections to maintain immutability
      new_state[target].sections = new_state[target].sections.map(
        (section) => ({
          ...section,
          objects:
            section.object_type === action.payload.type
              ? [...section.objects, action.payload.new_item]
              : [...section.objects]
        })
      )

      return new_state

    default:
      return state
  }
}

// export default function gridMenuReducer(state = {}, action) {
//   switch (action.type) {
//     case GridMenuActions.ITEM_ADDED:
//       var new_state = { ...state } // @todo why the shallow copy here?
//       if (action.payload.type !== 'project') {
//         new_state.owned_strategies = { ...new_state.owned_strategies }
//         new_state.owned_strategies.sections =
//           new_state.owned_strategies.sections.slice()
//         for (var i = 0; i < new_state.owned_projects.sections.length; i++) {
//           if (
//             new_state.owned_strategies.sections[i].object_type ==
//             action.payload.type
//           ) {
//             new_state.owned_strategies.sections[i].objects =
//               new_state.owned_strategies.sections[i].objects.slice()
//             new_state.owned_strategies.sections[i].objects.push(
//               action.payload.new_item
//             )
//           }
//         }
//       } else {
//         new_state.owned_projects = { ...new_state.owned_projects }
//         new_state.owned_projects.sections =
//           new_state.owned_projects.sections.slice()
//         for (var i = 0; i < new_state.owned_projects.sections.length; i++) {
//           if (
//             new_state.owned_projects.sections[i].object_type ==
//             action.payload.type
//           ) {
//             new_state.owned_projects.sections[i].objects =
//               new_state.owned_projects.sections[i].objects.slice()
//             new_state.owned_projects.sections[i].objects.push(
//               action.payload.new_item
//             )
//           }
//         }
//       }
//       return new_state
//     default:
//       return state
//   }
// }
