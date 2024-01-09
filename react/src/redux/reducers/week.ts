// @ts-nocheck
import { Week } from '@cfRedux/type'
import { AnyAction } from '@reduxjs/toolkit'
import {
  CommonActions,
  NodeActions,
  NodeWeekActions,
  StrategyActions,
  WeekActions
} from '@cfRedux/enumActions'

export default function weekReducer(
  state: Week[] = [],
  action: AnyAction
): Week[] {
  switch (action.type) {
    case CommonActions.REPLACE_STOREDATA:
      return action.payload.week || state

    case CommonActions.REFRESH_STOREDATA:
      return action.payload.week
        ? action.payload.week.reduce(
            (acc, newItem) => {
              const index = acc.findIndex((item) => item.id === newItem.id)
              if (index > -1) {
                acc[index] = newItem
              } else {
                acc.push(newItem)
              }
              return acc
            },
            [...state]
          )
        : state

    case WeekActions.CREATE_LOCK:
    case WeekActions.RELOAD_COMMENTS:
    case WeekActions.CHANGE_FIELD:
    case StrategyActions.TOGGLE_STRATEGY:
      return state.map((item) =>
        item.id === action.payload.id ? { ...item, ...action.payload } : item
      )

    case WeekActions.INSERT_BELOW:
    case StrategyActions.ADD_STRATEGY:
      return [...state, action.payload.new_model]

    case WeekActions.DELETE_SELF:
    case NodeActions.DELETE_SELF:
    case NodeActions.DELETE_SELF_SOFT:
      return state.filter((item) => item.id !== action.payload.id)

    case WeekActions.DELETE_SELF_SOFT:
    case WeekActions.RESTORE_SELF:
      return state.map((item) =>
        item.id === action.payload.id
          ? {
              ...item,
              deleted: !item.deleted,
              deleted_on: item.deleted ? undefined : 'This session'
            }
          : item
      )

    case NodeWeekActions.CHANGE_ID:
      return state.map((item) => ({
        ...item,
        nodeweek_set: item.nodeweek_set.map((id) =>
          id === action.payload.old_id ? action.payload.new_id : id
        )
      }))

    case NodeWeekActions.MOVED_TO:
      return state.map((item) => {
        if (item.nodeweek_set.includes(action.payload.id)) {
          const newSet = item.nodeweek_set.filter(
            (id) => id !== action.payload.id
          )
          if (item.id === action.payload.new_parent) {
            newSet.splice(action.payload.new_index, 0, action.payload.id)
          }
          return { ...item, nodeweek_set: newSet }
        }
        return item
      })

    case NodeActions.RESTORE_SELF:
    case NodeActions.INSERT_BELOW:
    case NodeActions.NEW_NODE:
      return state.map((item) => {
        if (item.id === action.payload.parentID) {
          const newSet = [...item.nodeweek_set]
          newSet.splice(action.payload.index, 0, action.payload.new_through.id)
          return { ...item, nodeweek_set: newSet }
        }
        return item
      })

    default:
      return state
  }
}

// import { Week } from '@cfRedux/type'
// import { AnyAction } from '@reduxjs/toolkit'
// import {
//   CommonActions,
//   NodeActions,
//   NodeWeekActions,
//   StrategyActions,
//   WeekActions
// } from '@cfRedux/enumActions'
//
// export default function weekReducer(
//   state: Week[] = [],
//   action: AnyAction
// ): Week[] {
//   switch (action.type) {
//     case CommonActions.REPLACE_STOREDATA:
//       if (action.payload.week) {
//         return action.payload.week
//       }
//       return state
//
//     case CommonActions.REFRESH_STOREDATA: {
//       var new_state = state.slice()
//       if (action.payload.week) {
//         for (var i = 0; i < action.payload.week.length; i++) {
//           const new_obj = action.payload.week[i]
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
//     /*******************************************************
//      * WEEK
//      *******************************************************/
//     case WeekActions.CREATE_LOCK: {
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.id) {
//           var new_state = state.slice()
//           new_state[i] = { ...new_state[i], lock: action.payload.lock }
//           return new_state
//         }
//       }
//       return state
//     }
//     case WeekActions.INSERT_BELOW: {
//       new_state = state.slice()
//       new_state.push(action.payload.new_model)
//       return new_state
//     }
//
//     case WeekActions.DELETE_SELF: {
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.id) {
//           var new_state = state.slice()
//           new_state.splice(i, 1)
//           return new_state
//         }
//       }
//       return state
//     }
//
//     case WeekActions.DELETE_SELF_SOFT: {
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
//     }
//
//     case WeekActions.RESTORE_SELF: {
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.id) {
//           var new_state = state.slice()
//           new_state[i] = { ...new_state[i], deleted: false }
//           return new_state
//         }
//       }
//       return state
//     }
//
//     case WeekActions.CHANGE_FIELD: {
//       if (
//         // @ts-ignore
//         action.payload.changeFieldID == COURSEFLOW_APP.contextData.changeFieldID
//       ) {
//         return state
//       }
//
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.id) {
//           var new_state = state.slice()
//           new_state[i] = { ...state[i], ...action.payload.json }
//           return new_state
//         }
//       }
//       return state
//     }
//
//     case WeekActions.RELOAD_COMMENTS: {
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
//
//     /*******************************************************
//      * NODE WEEK
//      *******************************************************/
//     case NodeWeekActions.CHANGE_ID: {
//       var new_state = state.slice()
//       for (var i = 0; i < state.length; i++) {
//         const old_index = state[i].nodeweek_set.indexOf(action.payload.old_id)
//         if (old_index >= 0) {
//           new_state[i] = { ...new_state[i] }
//           new_state[i].nodeweek_set = new_state[i].nodeweek_set.slice()
//           new_state[i].nodeweek_set.splice(old_index, 1, action.payload.new_id)
//         }
//       }
//       return new_state
//     }
//
//     case NodeWeekActions.MOVED_TO: {
//       let old_parent, old_parent_index, new_parent, new_parent_index
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].nodeweek_set.indexOf(action.payload.id) >= 0) {
//           old_parent_index = i
//           old_parent = { ...state[i] }
//         }
//         if (state[i].id == action.payload.new_parent) {
//           new_parent_index = i
//           new_parent = { ...state[i] }
//         }
//       }
//       const new_index = action.payload.new_index
//
//       var new_state = state.slice()
//       old_parent.nodeweek_set = old_parent.nodeweek_set.slice()
//       old_parent.nodeweek_set.splice(
//         old_parent.nodeweek_set.indexOf(action.payload.id),
//         1
//       )
//       if (old_parent_index == new_parent_index) {
//         old_parent.nodeweek_set.splice(new_index, 0, action.payload.id)
//       } else {
//         new_parent.nodeweek_set = new_parent.nodeweek_set.slice()
//         new_parent.nodeweek_set.splice(new_index, 0, action.payload.id)
//         new_state.splice(new_parent_index, 1, new_parent)
//       }
//       new_state.splice(old_parent_index, 1, old_parent)
//       return new_state
//     }
//
//     /*******************************************************
//      * NODE
//      *******************************************************/
//     case NodeActions.DELETE_SELF:
//     case NodeActions.DELETE_SELF_SOFT:
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].nodeweek_set.indexOf(action.payload.parent_id) >= 0) {
//           var new_state = state.slice()
//           new_state[i] = { ...new_state[i] }
//           new_state[i].nodeweek_set = state[i].nodeweek_set.slice()
//           new_state[i].nodeweek_set.splice(
//             new_state[i].nodeweek_set.indexOf(action.payload.parent_id),
//             1
//           )
//           return new_state
//         }
//       }
//       return state
//
//     case NodeActions.RESTORE_SELF:
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.parent_id) {
//           var new_state = state.slice()
//           new_state[i] = { ...new_state[i] }
//           new_state[i].nodeweek_set = state[i].nodeweek_set.slice()
//           new_state[i].nodeweek_set.splice(
//             action.payload.throughparent_index,
//             0,
//             action.payload.throughparent_id
//           )
//           return new_state
//         }
//       }
//       return state
//
//     case NodeActions.INSERT_BELOW:
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.parentID) {
//           var new_state = state.slice()
//           new_state[i] = { ...state[i] }
//           var new_nodeweek_set = state[i].nodeweek_set.slice()
//           new_nodeweek_set.splice(
//             action.payload.new_through.rank,
//             0,
//             action.payload.new_through.id
//           )
//           new_state[i].nodeweek_set = new_nodeweek_set
//           return new_state
//         }
//       }
//       return state
//
//     case NodeActions.NEW_NODE:
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.parentID) {
//           var new_state = state.slice()
//           new_state[i] = { ...state[i] }
//           var new_nodeweek_set = state[i].nodeweek_set.slice()
//           new_nodeweek_set.splice(
//             action.payload.index,
//             0,
//             action.payload.new_through.id
//           )
//           new_state[i].nodeweek_set = new_nodeweek_set
//           return new_state
//         }
//       }
//       return state
//
//     /*******************************************************
//      * STRATEGY
//      *******************************************************/
//     case StrategyActions.TOGGLE_STRATEGY: {
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.id) {
//           var new_state = state.slice()
//           new_state[i] = { ...state[i] }
//           new_state[i].is_strategy = action.payload.is_strategy
//           return new_state
//         }
//       }
//       return state
//     }
//
//     case StrategyActions.ADD_STRATEGY: {
//       new_state = state.slice()
//       new_state.push(action.payload.strategy)
//       return new_state
//     }
//
//     default:
//       return state
//   }
// }
