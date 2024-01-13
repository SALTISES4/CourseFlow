import {
  ColumnActions,
  CommonActions,
  NodeActions,
  StrategyActions
} from '@cfRedux/enumActions'
import { Column } from '@cfRedux/type'
import { AnyAction } from '@reduxjs/toolkit'

export default function columnReducer(
  state: Column[] = [],
  action: AnyAction
): Column[] {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      return action.payload.column || state

    case CommonActions.REFRESH_STOREDATA:
      return action.payload.column
        ? action.payload.column.reduce(
            (newState, new_obj) => {
              const index = newState.findIndex((item) => item.id === new_obj.id)
              if (index !== -1) {
                return [
                  ...newState.slice(0, index),
                  new_obj,
                  ...newState.slice(index + 1)
                ]
              }
              return [...newState, new_obj]
            },
            [...state]
          )
        : state

    case ColumnActions.CREATE_LOCK:
      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, lock: action.payload.lock }
          : item
      )

    case ColumnActions.DELETE_SELF:
      return state.filter((item) => item.id !== action.payload.id)

    case ColumnActions.DELETE_SELF_SOFT:
      return state.map((item) =>
        item.id === action.payload.id
          ? {
              ...item,
              deleted: true,
              deleted_on: window.gettext('This session')
            }
          : item
      )

    case ColumnActions.RESTORE_SELF:
      return state.map((item) =>
        item.id === action.payload.id ? { ...item, deleted: false } : item
      )

    case ColumnActions.INSERT_BELOW:
      return [...state, action.payload.new_model]

    case ColumnActions.CHANGE_FIELD:
      if (
        action.payload.changeFieldID ===
        // @ts-ignore
        COURSEFLOW_APP.contextData.changeFieldID
      )
        return state
      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, ...action.payload.json }
          : item
      )

    case ColumnActions.RELOAD_COMMENTS:
      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, comments: action.payload.comment_data }
          : item
      )

    case NodeActions.NEW_NODE:
      return state.some((item) => item.id === action.payload.column.id)
        ? state
        : [...state, action.payload.column]

    case StrategyActions.ADD_STRATEGY:
      return action.payload.columns_added.length === 0
        ? state
        : [...state, ...action.payload.columns_added]

    default:
      return state
  }
}

// export default function columnReducer(
//   state: Column[] = [],
//   action: AnyAction
// ): Column[] {
//   switch (action.type) {
//     case CommonActions.REPLACE_STOREDATA:
//       if (action.payload.column) return action.payload.column
//       return state
//
//     case CommonActions.REFRESH_STOREDATA: {
//       const new_state = state.slice()
//       if (action.payload.column) {
//         for (var i = 0; i < action.payload.column.length; i++) {
//           const new_obj = action.payload.collumn[i]
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
//     }
//
//     case ColumnActions.CREATE_LOCK:
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.id) {
//           var new_state = state.slice()
//           new_state[i] = { ...new_state[i], lock: action.payload.lock }
//           return new_state
//         }
//       }
//       return state
//
//     /*******************************************************
//      * COLUMN
//      *******************************************************/
//     case ColumnActions.DELETE_SELF:
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.id) {
//           var new_state = state.slice()
//           new_state.splice(i, 1)
//           return new_state
//         }
//       }
//       return state
//
//     case ColumnActions.DELETE_SELF_SOFT:
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.id) {
//           var new_state = state.slice()
//           new_state[i] = {
//             ...new_state[i],
//             deleted: true,
//             deleted_on: window.gettext('This session')
//           }
//           return new_state
//         }
//       }
//       return state
//
//     case ColumnActions.RESTORE_SELF:
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.id) {
//           var new_state = state.slice()
//           new_state[i] = { ...new_state[i], deleted: false }
//           return new_state
//         }
//       }
//       return state
//
//     case ColumnActions.INSERT_BELOW:
//       new_state = state.slice()
//       new_state.push(action.payload.new_model)
//       return new_state
//
//     case ColumnActions.CHANGE_FIELD:
//       if (
//         action.payload.changeFieldID == COURSEFLOW_APP.contextData.changeFieldID
//       )
//         return state
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.id) {
//           var new_state = state.slice()
//           new_state[i] = { ...state[i], ...action.payload.json }
//           return new_state
//         }
//       }
//       return state
//
//     case ColumnActions.RELOAD_COMMENTS: {
//       var new_state = state.slice()
//       for (var i = 0; i < new_state.length; i++) {
//         const obj = new_state[i]
//         if (obj.id == action.payload.id) {
//           new_state[i] = { ...obj, comments: action.payload.comment_data }
//           return new_state
//         }
//       }
//       return state
//     }
//     /*******************************************************
//      * NODE
//      *******************************************************/
//     case NodeActions.NEW_NODE:
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.column.id) return state
//       }
//       new_state = state.slice()
//       new_state.push(action.payload.column)
//       return new_state
//
//     /*******************************************************
//      * STRATEGY
//      *******************************************************/
//     case StrategyActions.ADD_STRATEGY:
//       if (action.payload.columns_added.length == 0) return state
//       new_state = state.slice()
//       new_state.push(...action.payload.columns_added)
//       return new_state
//
//     default:
//       return state
//   }
// }
