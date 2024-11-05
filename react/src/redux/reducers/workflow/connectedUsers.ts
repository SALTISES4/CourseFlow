import { _t } from '@cf/utility/Utility.class'
import {
  ColumnActions,
  CommonActions,
  NodeActions,
  StrategyActions
} from '@cfRedux/types/enumActions'
import { TColumn } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'

export default function columnReducer(
  state: TColumn[] = [],
  action: AnyAction
): TColumn[] {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      return action.payload.column || state

    case CommonActions.REFRESH_STOREDATA:
      return action.payload.column
        ? action.payload.column.reduce(
            (newState, newObj) => {
              const index = newState.findIndex((item) => item.id === newObj.id)
              if (index !== -1) {
                return [
                  ...newState.slice(0, index),
                  newObj,
                  ...newState.slice(index + 1)
                ]
              }
              return [...newState, newObj]
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
              deletedOn: _t('This session')
            }
          : item
      )

    case ColumnActions.RESTORE_SELF:
      return state.map((item) =>
        item.id === action.payload.id ? { ...item, deleted: false } : item
      )

    case ColumnActions.INSERT_BELOW:
      return [...state, action.payload.newModel]

    case ColumnActions.CHANGE_FIELD:

      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, ...action.payload.json }
          : item
      )

    case ColumnActions.RELOAD_COMMENTS:
      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, comments: action.payload.commentData }
          : item
      )

    case NodeActions.NEW_NODE:
      return state.some((item) => item.id === action.payload.column.id)
        ? state
        : [...state, action.payload.column]

    case StrategyActions.ADD_STRATEGY:
      return action.payload.columnsAdded.length === 0
        ? state
        : [...state, ...action.payload.columnsAdded]

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
//       const newState = state.slice()
//       if (action.payload.column) {
//         for (var i = 0; i < action.payload.column.length; i++) {
//           const newObj = action.payload.collumn[i]
//           let added = false
//           for (let j = 0; j < newState.length; j++) {
//             if (newState[j].id == newObj.id) {
//               newState.splice(j, 1, newObj)
//               added = true
//               break
//             }
//           }
//           if (added) continue
//           newState.push(newObj)
//         }
//       }
//       return newState
//     }
//
//     case ColumnActions.CREATE_LOCK:
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.id) {
//           var newState = state.slice()
//           newState[i] = { ...newState[i], lock: action.payload.lock }
//           return newState
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
//           var newState = state.slice()
//           newState.splice(i, 1)
//           return newState
//         }
//       }
//       return state
//
//     case ColumnActions.DELETE_SELF_SOFT:
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.id) {
//           var newState = state.slice()
//           newState[i] = {
//             ...newState[i],
//             deleted: true,
//             deletedOn: _t('This session')
//           }
//           return newState
//         }
//       }
//       return state
//
//     case ColumnActions.RESTORE_SELF:
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.id) {
//           var newState = state.slice()
//           newState[i] = { ...newState[i], deleted: false }
//           return newState
//         }
//       }
//       return state
//
//     case ColumnActions.INSERT_BELOW:
//       newState = state.slice()
//       newState.push(action.payload.newModel)
//       return newState
//
//     case ColumnActions.CHANGE_FIELD:
//       if (
//         action.payload.changeFieldId == COURSEFLOW_APP.contextData.changeFieldId
//       )
//         return state
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.id) {
//           var newState = state.slice()
//           newState[i] = { ...state[i], ...action.payload.json }
//           return newState
//         }
//       }
//       return state
//
//     case ColumnActions.RELOAD_COMMENTS: {
//       var newState = state.slice()
//       for (var i = 0; i < newState.length; i++) {
//         const obj = newState[i]
//         if (obj.id == action.payload.id) {
//           newState[i] = { ...obj, comments: action.payload.commentData }
//           return newState
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
//       newState = state.slice()
//       newState.push(action.payload.column)
//       return newState
//
//     /*******************************************************
//      * STRATEGY
//      *******************************************************/
//     case StrategyActions.ADD_STRATEGY:
//       if (action.payload.columnsAdded.length == 0) return state
//       newState = state.slice()
//       newState.push(...action.payload.columnsAdded)
//       return newState
//
//     default:
//       return state
//   }
// }
