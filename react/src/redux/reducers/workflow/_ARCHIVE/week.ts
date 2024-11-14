import {
  CommonActions,
  NodeActions,
  NodeWeekActions,
  StrategyActions,
  WeekActions
} from '@cfRedux/types/enumActions'
import { TWeek } from '@cfRedux/types/type'
import { AnyAction } from '@reduxjs/toolkit'

interface ReplaceStoreDataAction extends AnyAction {
  type: CommonActions.REPLACE_STOREDATA
  payload: { week?: TWeek[] }
}

interface RefreshStoreDataAction extends AnyAction {
  type: CommonActions.REFRESH_STOREDATA
  payload: { week: TWeek[] }
}

interface WeekByIdDataAction extends AnyAction {
  type:
    | WeekActions.DELETE_SELF
    | WeekActions.DELETE_SELF_SOFT
    | NodeActions.DELETE_SELF
    | NodeActions.DELETE_SELF_SOFT
  payload: { id: number }
}

interface WeekGenericAction extends AnyAction {
  type:
    | WeekActions.CREATE_LOCK
    | WeekActions.RELOAD_COMMENTS
    | WeekActions.CHANGE_FIELD
    | WeekActions.RESTORE_SELF
    | StrategyActions.TOGGLE_STRATEGY
  payload: {
    id: number
    [key: string]: any
  }
}

interface NodeGenericAction extends AnyAction {
  type:
    | NodeActions.RESTORE_SELF
    | NodeActions.INSERT_BELOW
    | NodeActions.NEW_NODE
  payload: {
    id: number
    index: number
    parentId: number
    newThrough: {
      id: number
    }
  }
}

interface InsertBelowAction extends AnyAction {
  type: WeekActions.INSERT_BELOW | StrategyActions.ADD_STRATEGY
  payload: {
    newModel: TWeek
  }
}

interface NodeWeekChangeIdAction extends AnyAction {
  type: NodeWeekActions.CHANGE_ID
  payload: {
    oldId: number
    newId: number
  }
}

interface NodeWeekMovedToAction extends AnyAction {
  type: NodeWeekActions.MOVED_TO
  payload: {
    id: number
    newParent: number
    newIndex: number
  }
}

// Union type for all actions handled by the reducer
type WeekActionTypes =
  | ReplaceStoreDataAction
  | RefreshStoreDataAction
  | WeekGenericAction
  | WeekByIdDataAction
  | InsertBelowAction
  | NodeWeekChangeIdAction
  | NodeWeekMovedToAction
  | NodeGenericAction

export default function weekReducer(
  state: TWeek[] = [],
  action: WeekActionTypes
): TWeek[] {
  switch (action.type) {
    // case CommonActions.REPLACE_STOREDATA:
    //   return action.payload.week || state

    // case CommonActions.REFRESH_STOREDATA:
    //   return action.payload.week
    //     ? action.payload.week.reduce(
    //         (acc, newItem) => {
    //           const index = acc.findIndex((item) => item.id === newItem.id)
    //           if (index > -1) {
    //             acc[index] = newItem
    //           } else {
    //             acc.push(newItem)
    //           }
    //           return acc
    //         },
    //         [...state]
    //       )
    //     : state

    //     case WeekActions.CREATE_LOCK:
    //  case WeekActions.RELOAD_COMMENTS:
    // case StrategyActions.TOGGLE_STRATEGY:
    //   return state.map((item) =>
    //     item.id === action.payload.id ? { ...item, ...action.payload } : item
    //   )

    // case WeekActions.CHANGE_FIELD:
    //   return state.map((item) =>
    //     item.id === action.payload.id
    //       ? { ...item, ...action.payload.json }
    //       : item
    //   )
//    case WeekActions.INSERT_BELOW:
//     case StrategyActions.ADD_STRATEGY:
//       return [...state, action.payload.newModel]

//    case WeekActions.DELETE_SELF:
//     case NodeActions.DELETE_SELF_SOFT:
//       return state.filter((item) => item.id !== action.payload.id)

    // case WeekActions.DELETE_SELF_SOFT:
    // case WeekActions.RESTORE_SELF: {
    //   return state.map((item) => {
    //     if (item.id === action.payload.id) {
    //       return {
    //         ...item,
    //         deleted: !item.deleted,
    //         deletedOn: item.deleted ? undefined : 'This session'
    //       }
    //     }
    //
    //     return item
    //   })
    // }

    // case NodeWeekActions.CHANGE_ID:
    //   return state.map((item) => ({
    //     ...item,
    //     nodeweekSet: item.nodeweekSet.map((id) =>
    //       id === action.payload.oldId ? action.payload.newId : id
    //     )
    //   }))

    // case NodeWeekActions.MOVED_TO:
    //   return state.map((item) => {
    //     const newSet = item.nodeweekSet.filter((id) => id !== action.payload.id)
    //     if (item.id === action.payload.newParent) {
    //       newSet.splice(action.payload.newIndex, 0, action.payload.id)
    //       return { ...item, nodeweekSet: newSet }
    //     }
    //     return item
    //   })

    // case NodeActions.RESTORE_SELF:
    // case NodeActions.INSERT_BELOW:
    // case NodeActions.NEW_NODE:
    //   return state.map((item) => {
    //     if (item.id === action.payload.parentId) {
    //       const newSet = [...item.nodeweekSet]
    //       newSet.splice(action.payload.index, 0, action.payload.newThrough.id)
    //       return { ...item, nodeweekSet: newSet }
    //     }
    //     return item
    //   })

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
//           const newObj = action.payload.week[i]
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
//       newState.push(action.payload.newModel)
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
//     case WeekActions.CHANGE_FIELD: {
//       if (
//         // @ts-ignore
//         action.payload.changeFieldId == COURSEFLOW_APP.contextData.changeFieldId
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
//           newState[i] = { ...obj, comments: action.payload.commentData }
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
//         const oldIndex = state[i].nodeweekSet.indexOf(action.payload.oldId)
//         if (oldIndex >= 0) {
//           newState[i] = { ...newState[i] }
//           newState[i].nodeweekSet = newState[i].nodeweekSet.slice()
//           newState[i].nodeweekSet.splice(oldIndex, 1, action.payload.newId)
//         }
//       }
//       return newState
//     }
//
//     case NodeWeekActions.MOVED_TO: {
//       let old_parent, old_parent_index, newParent, newParent_index
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].nodeweekSet.indexOf(action.payload.id) >= 0) {
//           old_parent_index = i
//           old_parent = { ...state[i] }
//         }
//         if (state[i].id == action.payload.newParent) {
//           newParent_index = i
//           newParent = { ...state[i] }
//         }
//       }
//       const newIndex = action.payload.newIndex
//
//       var newState = state.slice()
//       old_parent.nodeweekSet = old_parent.nodeweekSet.slice()
//       old_parent.nodeweekSet.splice(
//         old_parent.nodeweekSet.indexOf(action.payload.id),
//         1
//       )
//       if (old_parent_index == newParent_index) {
//         old_parent.nodeweekSet.splice(newIndex, 0, action.payload.id)
//       } else {
//         newParent.nodeweekSet = newParent.nodeweekSet.slice()
//         newParent.nodeweekSet.splice(newIndex, 0, action.payload.id)
//         newState.splice(newParent_index, 1, newParent)
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
//         if (state[i].nodeweekSet.indexOf(action.payload.parentId) >= 0) {
//           var newState = state.slice()
//           newState[i] = { ...newState[i] }
//           newState[i].nodeweekSet = state[i].nodeweekSet.slice()
//           newState[i].nodeweekSet.splice(
//             newState[i].nodeweekSet.indexOf(action.payload.parentId),
//             1
//           )
//           return newState
//         }
//       }
//       return state
//
//     case NodeActions.RESTORE_SELF:
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.parentId) {
//           var newState = state.slice()
//           newState[i] = { ...newState[i] }
//           newState[i].nodeweekSet = state[i].nodeweekSet.slice()
//           newState[i].nodeweekSet.splice(
//             action.payload.throughparentIndex,
//             0,
//             action.payload.throughparentId
//           )
//           return newState
//         }
//       }
//       return state
//
//     case NodeActions.INSERT_BELOW:
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.parentId) {
//           var newState = state.slice()
//           newState[i] = { ...state[i] }
//           var new_nodeweekSet = state[i].nodeweekSet.slice()
//           new_nodeweekSet.splice(
//             action.payload.newThrough.rank,
//             0,
//             action.payload.newThrough.id
//           )
//           newState[i].nodeweekSet = new_nodeweekSet
//           return newState
//         }
//       }
//       return state
//
//     case NodeActions.NEW_NODE:
//       for (var i = 0; i < state.length; i++) {
//         if (state[i].id == action.payload.parentId) {
//           var newState = state.slice()
//           newState[i] = { ...state[i] }
//           var new_nodeweekSet = state[i].nodeweekSet.slice()
//           new_nodeweekSet.splice(
//             action.payload.index,
//             0,
//             action.payload.newThrough.id
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
