import {
  CommonActions,
  NodeActions,
  NodeWeekActions,
  StrategyActions,
  WeekActions
} from '@cfRedux/types/enumActions'
import { TWeek } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'

export default function weekReducer(
  state: TWeek[] = [],
  action: AnyAction
): TWeek[] {
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
    case StrategyActions.TOGGLE_STRATEGY:
      return state.map((item) =>
        item.id === action.payload.id ? { ...item, ...action.payload } : item
      )
    case WeekActions.changeField:
      return state.map((item) =>
        item.id === action.payload.id
          ? { ...item, ...action.payload.json }
          : item
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
              deletedOn: item.deleted ? undefined : 'This session'
            }
          : item
      )

    case NodeWeekActions.CHANGE_ID:
      return state.map((item) => ({
        ...item,
        nodeweekSet: item.nodeweekSet.map((id) =>
          id === action.payload.old_id ? action.payload.new_id : id
        )
      }))

    case NodeWeekActions.MOVED_TO:
      return state.map((item) => {
        const newSet = item.nodeweekSet.filter(
          (id) => id !== action.payload.id
        )
        if (item.id === action.payload.new_parent) {
          newSet.splice(action.payload.new_index, 0, action.payload.id)
        }
        return { ...item, nodeweekSet: newSet }
        return item
      })

    case NodeActions.RESTORE_SELF:
    case NodeActions.INSERT_BELOW:
    case NodeActions.NEW_NODE:
      return state.map((item) => {
        if (item.id === action.payload.parentID) {
          const newSet = [...item.nodeweekSet]
          newSet.splice(action.payload.index, 0, action.payload.new_through.id)
          return { ...item, nodeweekSet: newSet }
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
//       var newState = state.slice()
//       if (action.payload.week) {
//         for (var i = 0; i < action.payload.week.length; i++) {
//           const new_obj = action.payload.week[i]
//           let added = false
//           for (let j = 0; j < newState.length; j++) {
//             if (newState[j].id == new_obj.id) {
//               newState.splice(j, 1, new_obj)
//               added = true
//               break
//             }
//           }
//           if (added) continue
//           newState.push(new_obj)
//         }
//       }
//       return newState
//     }
//
//     /*******************************************************
//      * WEEK
//      *******************************************************/
//     case WeekActions.CREATE_LOCK: {
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.id) {
//           var newState = state.slice()
//           newState[i] = { ...newState[i], lock: action.payload.lock }
//           return newState
//         }
//       }
//       return state
//     }
//     case WeekActions.INSERT_BELOW: {
//       newState = state.slice()
//       newState.push(action.payload.new_model)
//       return newState
//     }
//
//     case WeekActions.DELETE_SELF: {
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.id) {
//           var newState = state.slice()
//           newState.splice(i, 1)
//           return newState
//         }
//       }
//       return state
//     }
//
//     case WeekActions.DELETE_SELF_SOFT: {
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
//     }
//
//     case WeekActions.RESTORE_SELF: {
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.id) {
//           var newState = state.slice()
//           newState[i] = { ...newState[i], deleted: false }
//           return newState
//         }
//       }
//       return state
//     }
//
//     case WeekActions.changeField: {
//       if (
//         // @ts-ignore
//         action.payload.changeFieldID == COURSEFLOW_APP.contextData.changeFieldID
//       ) {
//         return state
//       }
//
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.id) {
//           var newState = state.slice()
//           newState[i] = { ...state[i], ...action.payload.json }
//           return newState
//         }
//       }
//       return state
//     }
//
//     case WeekActions.RELOAD_COMMENTS: {
//       var newState = state.slice()
//       for (var i = 0; i < newState.length; i++) {
//         const obj = newState[i]
//         if (obj.id == action.payload.id) {
//           newState[i] = { ...obj, comments: action.payload.comment_data }
//           return newState
//         }
//       }
//       return state
//     }
//
//     /*******************************************************
//      * NODE WEEK
//      *******************************************************/
//     case NodeWeekActions.CHANGE_ID: {
//       var newState = state.slice()
//       for (var i = 0; i < state.length; i++) {
//         const old_index = state[i].nodeweekSet.indexOf(action.payload.old_id)
//         if (old_index >= 0) {
//           newState[i] = { ...newState[i] }
//           newState[i].nodeweekSet = newState[i].nodeweekSet.slice()
//           newState[i].nodeweekSet.splice(old_index, 1, action.payload.new_id)
//         }
//       }
//       return newState
//     }
//
//     case NodeWeekActions.MOVED_TO: {
//       let old_parent, old_parent_index, new_parent, new_parent_index
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].nodeweekSet.indexOf(action.payload.id) >= 0) {
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
//       var newState = state.slice()
//       old_parent.nodeweekSet = old_parent.nodeweekSet.slice()
//       old_parent.nodeweekSet.splice(
//         old_parent.nodeweekSet.indexOf(action.payload.id),
//         1
//       )
//       if (old_parent_index == new_parent_index) {
//         old_parent.nodeweekSet.splice(new_index, 0, action.payload.id)
//       } else {
//         new_parent.nodeweekSet = new_parent.nodeweekSet.slice()
//         new_parent.nodeweekSet.splice(new_index, 0, action.payload.id)
//         newState.splice(new_parent_index, 1, new_parent)
//       }
//       newState.splice(old_parent_index, 1, old_parent)
//       return newState
//     }
//
//     /*******************************************************
//      * NODE
//      *******************************************************/
//     case NodeActions.DELETE_SELF:
//     case NodeActions.DELETE_SELF_SOFT:
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].nodeweekSet.indexOf(action.payload.parent_id) >= 0) {
//           var newState = state.slice()
//           newState[i] = { ...newState[i] }
//           newState[i].nodeweekSet = state[i].nodeweekSet.slice()
//           newState[i].nodeweekSet.splice(
//             newState[i].nodeweekSet.indexOf(action.payload.parent_id),
//             1
//           )
//           return newState
//         }
//       }
//       return state
//
//     case NodeActions.RESTORE_SELF:
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.parent_id) {
//           var newState = state.slice()
//           newState[i] = { ...newState[i] }
//           newState[i].nodeweekSet = state[i].nodeweekSet.slice()
//           newState[i].nodeweekSet.splice(
//             action.payload.throughparent_index,
//             0,
//             action.payload.throughparent_id
//           )
//           return newState
//         }
//       }
//       return state
//
//     case NodeActions.INSERT_BELOW:
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.parentID) {
//           var newState = state.slice()
//           newState[i] = { ...state[i] }
//           var new_nodeweekSet = state[i].nodeweekSet.slice()
//           new_nodeweekSet.splice(
//             action.payload.new_through.rank,
//             0,
//             action.payload.new_through.id
//           )
//           newState[i].nodeweekSet = new_nodeweekSet
//           return newState
//         }
//       }
//       return state
//
//     case NodeActions.NEW_NODE:
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.parentID) {
//           var newState = state.slice()
//           newState[i] = { ...state[i] }
//           var new_nodeweekSet = state[i].nodeweekSet.slice()
//           new_nodeweekSet.splice(
//             action.payload.index,
//             0,
//             action.payload.new_through.id
//           )
//           newState[i].nodeweekSet = new_nodeweekSet
//           return newState
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
//           var newState = state.slice()
//           newState[i] = { ...state[i] }
//           newState[i].isStrategy = action.payload.isStrategy
//           return newState
//         }
//       }
//       return state
//     }
//
//     case StrategyActions.ADD_STRATEGY: {
//       newState = state.slice()
//       newState.push(action.payload.strategy)
//       return newState
//     }
//
//     default:
//       return state
//   }
// }
