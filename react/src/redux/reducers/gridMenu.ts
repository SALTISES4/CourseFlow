// @ts-nocheck
export default function gridMenuReducer(state = {}, action) {
  switch (action.type) {
    case 'gridmenu/itemAdded':
      var new_state = { ...state } // @todo why the shallow copy here?
      if (action.payload.type != 'project') {
        new_state.owned_strategies = { ...new_state.owned_strategies }
        new_state.owned_strategies.sections =
          new_state.owned_strategies.sections.slice()
        for (var i = 0; i < new_state.owned_projects.sections.length; i++) {
          if (
            new_state.owned_strategies.sections[i].object_type ==
            action.payload.type
          ) {
            new_state.owned_strategies.sections[i].objects =
              new_state.owned_strategies.sections[i].objects.slice()
            new_state.owned_strategies.sections[i].objects.push(
              action.payload.new_item
            )
          }
        }
      } else {
        new_state.owned_projects = { ...new_state.owned_projects }
        new_state.owned_projects.sections =
          new_state.owned_projects.sections.slice()
        for (var i = 0; i < new_state.owned_projects.sections.length; i++) {
          if (
            new_state.owned_projects.sections[i].object_type ==
            action.payload.type
          ) {
            new_state.owned_projects.sections[i].objects =
              new_state.owned_projects.sections[i].objects.slice()
            new_state.owned_projects.sections[i].objects.push(
              action.payload.new_item
            )
          }
        }
      }
      return new_state
    default:
      return state
  }
}
