import {
  CommonActions,
  NodeActions,
  NodeWeekActions,
  OutcomeActions,
  ReduxSlice,
  StrategyActions,
  WeekActions
} from '@cfRedux/types/enumActions'
import { AppState, TNode, TWeek } from '@cfRedux/types/type'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'

interface WeekPayload {
  id: number
  json?: any
  [key: string]: any
}

interface InsertBelowPayload {
  newModel: TWeek
}

interface ChangeIdPayload {
  oldId: number
  newId: number
}

interface MovedToPayload {
  id: number
  newParent: number
  newIndex: number
}

interface NodeGenericPayload {
  id: number
  index: number
  parentId: number
  newThrough: { id: number }
}

interface ReplaceStoreDataPayload {
  week?: TWeek[]
}

interface RefreshStoreDataPayload {
  week: TWeek[]
}

const initialState: TWeek[] = []

export const updateEntity = (
  state: AppState['week'],
  action: PayloadAction<{
    id: number
    data: Pick<TWeek>
  }>
) => {
  state.forEach((item) => {
    if (item.id === action.payload.id) {
      Object.assign(item, action.payload.data)
    }
  })
}

const createEntity = (state, action: PayloadAction<InsertBelowPayload>) => {
  return state.push(action.payload.newModel)
}

const removeEntityById = (state, action: PayloadAction<WeekPayload>) => {
  return state.filter((item) => item.id !== action.payload.id)
}

const toggleArchiveEntity = (state, action: PayloadAction<{ id: number }>) => {
  return state.map((item) => {
    if (item.id === action.payload.id) {
      return {
        ...item,
        deleted: !item.deleted,
        deletedOn: item.deleted ? undefined : 'This session'
      }
    }
    return item
  })
}

const newNode = (state, action: PayloadAction<NodeGenericPayload>) => {
  return state.map((item) => {
    if (item.id === action.payload.parentId) {
      const newSet = [...item.nodeweekSet]
      newSet.splice(action.payload.index, 0, action.payload.newThrough.id)
      return { ...item, nodeweekSet: newSet }
    }
    return item
  })
}

const weekSlice = createSlice<AppState['week']>({
  name: ReduxSlice.WEEK,
  initialState,
  reducers: {
    insertBelow: createEntity,
    reloadComments: updateEntity,
    deleteSelf: removeEntityById,
    // MISC
    createLock: updateEntity,
    deleteSelfSoft: toggleArchiveEntity,
    restoreSelf: toggleArchiveEntity,
    movedTo(state, action: PayloadAction<MovedToPayload>) {
      return state.map((item) => {
        const newSet = item.nodeweekSet.filter((id) => id !== action.payload.id)
        if (item.id === action.payload.newParent) {
          newSet.splice(action.payload.newIndex, 0, action.payload.id)
          return { ...item, nodeweekSet: newSet }
        }
        return item
      })
    },
    // updating single fields
    // this is responsible for:
    //
    changeField: updateEntity,
    changeId(state, action: PayloadAction<ChangeIdPayload>) {
      return state.map((item) => ({
        ...item,
        nodeweekSet: item.nodeweekSet.map((id) =>
          id === action.payload.oldId ? action.payload.newId : id
        )
      }))
    }
  },
  extraReducers: (builder) => {
    /*******************************************************
     * COMMON
     *******************************************************/
    builder
      .addCase(
        CommonActions.REPLACE_STOREDATA,
        (state, action: PayloadAction<ReplaceStoreDataPayload>) => {
          return action.payload.week || state
        }
      )
      .addCase(
        /*******************************************************
         * COMMON
         *******************************************************/
        CommonActions.REFRESH_STOREDATA,
        (state, action: PayloadAction<RefreshStoreDataPayload>) => {
          if (action.payload.week) {
            return action.payload.week.reduce(
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
          }
          return state
        }
      )
      /*******************************************************
       * STRATEGY
       *******************************************************/
      .addCase(StrategyActions.TOGGLE_STRATEGY, updateEntity)
      .addCase(StrategyActions.ADD_STRATEGY, createEntity)

    /*******************************************************
     * NODE
     *******************************************************/
    // i don;t think this one makes sense
    builder
      .addCase(NodeActions.DELETE_SELF_SOFT, removeEntityById)
      .addCase(NodeActions.RESTORE_SELF, newNode)
      .addCase(NodeActions.NEW_NODE, newNode)
      .addCase(NodeActions.INSERT_BELOW, newNode)
    /*******************************************************
     * NODEWEEK
     * // @todo needs review
     *******************************************************/
    builder
      .addCase(
        NodeWeekActions.CHANGE_ID,
        (state, action: PayloadAction<RefreshStoreDataPayload>) => {
          return state.map((item) => ({
            ...item,
            nodeweekSet: item.nodes.map((id) =>
              id === action.payload.oldId ? action.payload.newId : id
            )
          }))
        }
      )
      .addCase(
        NodeWeekActions.MOVED_TO,
        (state, action: PayloadAction<RefreshStoreDataPayload>) => {
          return state.map((item) => {
            const newSet = item.nodes.filter((id) => id !== action.payload.id)
            if (item.id === action.payload.newParent) {
              newSet.splice(action.payload.newIndex, 0, action.payload.id)
              return { ...item, nodeweekSet: newSet }
            }
            return item
          })
        }
      )
  }
})

export const {
  replaceStoreData: weekReplaceStoreData,
  refreshStoreData: weekRefreshStoreData,
  createLock: weekCreateLock,
  reloadComments: weekReloadComments,
  changeField: weekChangeField,
  insertBelow: weekInsertBelow,
  deleteSelf: weekDeleteSelf,
  deleteSelfSoft: weekDeleteSelfSoft,
  restoreSelf: weekRestoreSelf,
  changeId: weekChangeId,
  movedTo: weekMovedTo
} = weekSlice.actions

export default weekSlice.reducer
