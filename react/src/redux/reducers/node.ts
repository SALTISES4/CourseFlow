// @ts-nocheck
import * as Utility from "@cfUtility";

export default  function nodeReducer(state = [], action) {
  switch (action.type) {
    case 'replaceStoreData':
      if (action.payload.node) return action.payload.node
      return state
    case 'refreshStoreData':
      var new_state = state.slice()
      if (action.payload.node) {
        for (var i = 0; i < action.payload.node.length; i++) {
          const new_obj = action.payload.node[i]
          let added = false
          for (var j = 0; j < new_state.length; j++) {
            if (new_state[j].id == new_obj.id) {
              new_state.splice(j, 1, new_obj)
              added = true
              break
            }
          }
          if (added) continue
          new_state.push(new_obj)
        }
      }
      return new_state
    case 'node/createLock':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          var new_state = state.slice()
          new_state[i] = { ...new_state[i], lock: action.payload.lock }
          return new_state
        }
      }
      return state
    case 'column/deleteSelf':
    case 'column/deleteSelfSoft':
      var new_state = state.slice()
      var new_column
      if (action.payload.extra_data) {
        new_column = action.payload.extra_data
      }
      for (var i = 0; i < state.length; i++) {
        if (state[i].column == action.payload.id) {
          new_state[i] = { ...state[i], column: new_column }
        }
      }
      Utility.triggerHandlerEach($('.week .node'), 'component-updated')
      return new_state
    case 'column/restoreSelf':
      var new_state = state.slice()
      var new_column
      if (action.payload.id) {
        new_column = action.payload.id
      }

      for (var i = 0; i < state.length; i++) {
        if (action.payload.extra_data.indexOf(state[i].id) >= 0) {
          new_state[i] = { ...state[i], column: new_column }
        }
      }
      Utility.triggerHandlerEach($('.week .node'), 'component-updated')
      return new_state
    case 'node/changedColumn':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          var new_state = state.slice()
          new_state[i] = { ...new_state[i], column: action.payload.new_column }
          return new_state
        }
      }
      return state
    case 'node/deleteSelf':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          var new_state = state.slice()
          new_state.splice(i, 1)
          Utility.triggerHandlerEach($('.week .node'), 'component-updated')
          return new_state
        }
      }
      return state
    case 'node/deleteSelfSoft':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          var new_state = state.slice()
          new_state[i] = {
            ...new_state[i],
            deleted: true,
            deleted_on: window.gettext('This session')
          }
          Utility.triggerHandlerEach($('.week .node'), 'component-updated')
          return new_state
        }
      }
      return state
    case 'node/restoreSelf':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          var new_state = state.slice()
          new_state[i] = { ...new_state[i], deleted: false }
          Utility.triggerHandlerEach($('.week .node'), 'component-updated')
          return new_state
        }
      }
      return state
    case 'nodelink/deleteSelf':
    case 'nodelink/deleteSelfSoft':
      for (var i = 0; i < state.length; i++) {
        if (state[i].outgoing_links.indexOf(action.payload.id) >= 0) {
          var new_state = state.slice()
          new_state[i] = { ...new_state[i] }
          new_state[i].outgoing_links = state[i].outgoing_links.slice()
          new_state[i].outgoing_links.splice(
            new_state[i].outgoing_links.indexOf(action.payload.id),
            1
          )
          return new_state
        }
      }
      return state
    case 'nodelink/restoreSelf':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.parent_id) {
          var new_state = state.slice()
          new_state[i] = { ...new_state[i] }
          new_state[i].outgoing_links = state[i].outgoing_links.slice()
          new_state[i].outgoing_links.push(action.payload.id)
          return new_state
        }
      }
      return state
    case 'week/insertBelow':
      if (!action.payload.children) return state
      new_state = state.slice()
      for (var i = 0; i < action.payload.children.node.length; i++) {
        new_state.push(action.payload.children.node[i])
      }
      return new_state
    case 'node/insertBelow':
    case 'node/newNode':
      new_state = state.slice()
      new_state.push(action.payload.new_model)
      return new_state
    case 'node/changeField':
      if (
        action.payload.changeFieldID == COURSEFLOW_APP.contextData.changeFieldID
      )
        return state
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          var new_state = state.slice()
          new_state[i] = { ...state[i], ...action.payload.json }
          return new_state
        }
      }
      return state
    case 'node/setLinkedWorkflow':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.id) {
          var new_state = state.slice()
          new_state[i] = { ...state[i] }
          new_state[i].linked_workflow = action.payload.linked_workflow
          new_state[i].linked_workflow_data =
            action.payload.linked_workflow_data
          return new_state
        }
      }
      return state
    case 'nodelink/newNodeLink':
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.new_model.source_node) {
          var new_state = state.slice()
          new_state[i] = { ...state[i] }
          const new_outgoing_links = state[i].outgoing_links.slice()
          new_outgoing_links.push(action.payload.new_model.id)
          new_state[i].outgoing_links = new_outgoing_links
          return new_state
        }
      }
      return state
    case 'outcomenode/updateDegree':
      //Returns -1 if the outcome had already been added to the node at the given degree
      if (action.payload.outcomenode == -1) return state
      for (var i = 0; i < state.length; i++) {
        if (state[i].id == action.payload.data_package[0].node) {
          var new_state = state.slice()
          new_state[i] = { ...new_state[i] }
          new_state[i].outcomenode_set = action.payload.new_outcomenode_set
          new_state[i].outcomenode_unique_set =
            action.payload.new_outcomenode_unique_set
          return new_state
        }
      }
      return state
    case 'strategy/addStrategy':
      if (action.payload.nodes_added.length == 0) return state
      new_state = state.slice()
      new_state.push(...action.payload.nodes_added)
      return new_state
    case 'outcome/deleteSelf':
    case 'outcome/deleteSelfSoft':
    case 'outcome_base/deleteSelf':
    case 'outcome_base/deleteSelfSoft':
    case 'outcome/restoreSelf':
    case 'outcome_base/restoreSelf':
      new_state = state.slice()
      for (var i = 0; i < action.payload.extra_data.length; i++) {
        const new_node_data = action.payload.extra_data[i]
        for (var j = 0; j < new_state.length; j++) {
          if (new_node_data.id == new_state[j].id) {
            new_state[j] = { ...new_state[j], ...new_node_data }
          }
        }
      }
      return new_state
    case 'node/reloadComments':
      var new_state = state.slice()
      for (var i = 0; i < new_state.length; i++) {
        const obj = new_state[i]
        if (obj.id == action.payload.id) {
          new_state[i] = { ...obj, comments: action.payload.comment_data }
          return new_state
        }
      }
      return state
    case 'node/reloadAssignments':
      var new_state = state.slice()
      for (var i = 0; i < new_state.length; i++) {
        const obj = new_state[i]
        if (obj.id == action.payload.id) {
          new_state[i] = {
            ...obj,
            has_assignment: action.payload.has_assignment
          }
          return new_state
        }
      }
    case 'outcome/insertChild':
    case 'outcome/insertBelow':
    case 'outcome_base/insertChild':
    case 'outcomeoutcome/changeID':
      if (action.payload.node_updates.length == 0) return state
      var new_state = state.slice()
      for (var i = 0; i < action.payload.node_updates.length; i++) {
        for (var j = 0; j < state.length; j++) {
          if (action.payload.node_updates[i].id == state[j].id) {
            new_state[j] = {
              ...new_state[j],
              outcomenode_set: action.payload.node_updates[i].outcomenode_set,
              outcomenode_unique_set:
                action.payload.node_updates[i].outcomenode_unique_set
            }
          }
        }
      }
      return new_state
    default:
      return state
  }
}
