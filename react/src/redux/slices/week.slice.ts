import {
  CommonActions,
  NodeActions,
  ReduxSlice,
  StrategyActions
} from '@cfRedux/types/enumActions'
import { AppState, TWeek, WorkspaceAppState } from '@cfRedux/types/type'
import {
  PayloadAction,
  createAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

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

// const initialState: WorkspaceAppState['week'] = []
export const weekAdapter = createEntityAdapter<TWeek>()
const initialState = weekAdapter.getInitialState()

export const updateEntity = (
  state: WorkspaceAppState['week'],
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

/*******************************************************
 * CREATE ACTIONS
 *******************************************************/
export const replaceStoreData = createAction<{
  week: WorkspaceAppState['week'] | undefined
}>(CommonActions.REPLACE_STOREDATA)

export const refreshStoreData = createAction<{
  week: WorkspaceAppState['week'] | undefined
}>(CommonActions.REFRESH_STOREDATA)

/*******************************************************
 * SLICE
 *******************************************************/
const weekSlice = createSlice({
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
    // this action makes no sense
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
    builder
      /*******************************************************
       * COMMON
       *******************************************************/
      .addCase(replaceStoreData, (state, action) => {
        return action.payload.week || state
      })
      .addCase(refreshStoreData, (state, action) => {
        if (action.payload.week) {
          weekAdapter.upsertMany(state, action.payload.week)
        }
      })
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
    // builder
    //   .addCase(
    //     NodeWeekActions.CHANGE_ID,
    //     (state, action: PayloadAction<RefreshStoreDataPayload>) => {
    //       return state.map((item) => ({
    //         ...item,
    //         nodeweekSet: item.nodes.map((id) =>
    //           id === action.payload.oldId ? action.payload.newId : id
    //         )
    //       }))
    //     }
    //   )
    //   .addCase(
    //     NodeWeekActions.MOVED_TO,
    //     (state, action: PayloadAction<RefreshStoreDataPayload>) => {
    //       return state.map((item) => {
    //         const newSet = item.nodes.filter((id) => id !== action.payload.id)
    //         if (item.id === action.payload.newParent) {
    //           newSet.splice(action.payload.newIndex, 0, action.payload.id)
    //           return { ...item, nodeweekSet: newSet }
    //         }
    //         return item
    //       })
    //     }
    //   )
  }
})

export const {
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
