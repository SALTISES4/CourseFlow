import { GridMenuActions } from '@cfRedux/types/enumActions'

type ParentWorkflow = any

export default function projectMenuReducer(
  state: ParentWorkflow = {},
  action
): ParentWorkflow {
  switch (action.type) {
    case GridMenuActions.ITEM_ADDED:
      return {
        ...state,
        currentProject: {
          ...state.currentProject,
          sections: state.currentProject.sections.map((section) =>
            section.objectType === action.payload.type
              ? {
                  ...section,
                  objects: [...section.objects, action.payload.newItem]
                }
              : section
          )
        }
      }

    default:
      return state
  }
}

// export default function projectMenuReducer(state = {}, action) {
//   switch (action.type) {
//     case 'gridmenu/itemAdded':
//       var newState = { ...state } // @todo why the shallow copy here?
//       newState.currentProject = { ...newState.currentProject }
//       newState.currentProject.sections =
//         newState.currentProject.sections.slice()
//       for (let i = 0; i < newState.currentProject.sections.length; i++) {
//         if (
//           newState.currentProject.sections[i].objectType ==
//           action.payload.type
//         ) {
//           newState.currentProject.sections[i].objects =
//             newState.currentProject.sections[i].objects.slice()
//           newState.currentProject.sections[i].objects.push(
//             action.payload.newItem
//           )
//         }
//       }
//       return newState
//     default:
//       return state
//   }
// }
