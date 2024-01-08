// @ts-nocheck
export default function projectMenuReducer(state = {}, action) {
  switch (action.type) {
    case 'gridmenu/itemAdded':
      var new_state = { ...state } // @todo why the shallow copy here?
      new_state.current_project = { ...new_state.current_project }
      new_state.current_project.sections =
        new_state.current_project.sections.slice()
      for (let i = 0; i < new_state.current_project.sections.length; i++) {
        if (
          new_state.current_project.sections[i].object_type ==
          action.payload.type
        ) {
          new_state.current_project.sections[i].objects =
            new_state.current_project.sections[i].objects.slice()
          new_state.current_project.sections[i].objects.push(
            action.payload.new_item
          )
        }
      }
      return new_state
    default:
      return state
  }
}
