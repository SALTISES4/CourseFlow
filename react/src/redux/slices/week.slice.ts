import { nodeAdapter } from '@cfRedux/slices/node.slice'
import store from '@cfRedux/store'
import {
  CommonActions,
  NodeActions,
  SliceNamespace,
  StrategyActions
} from '@cfRedux/types/enumActions'
import { AppState, TWeek, WorkspaceAppState } from '@cfRedux/types/type'
import {
  PayloadAction,
  Update,
  createAction,
  createEntityAdapter,
  createSlice,
  current
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

export const weekAdapter = createEntityAdapter<TWeek>()
type WeekState = ReturnType<typeof weekAdapter.getInitialState>
const initialState = weekAdapter.getInitialState()

export const updateEntity = (
  state: WeekState,
  action: PayloadAction<{ id: number; data: Partial<TWeek> }>
) => {
  weekAdapter.updateOne(state, {
    id: action.payload.id,
    changes: action.payload.data
  })
}

const createEntity = (
  state: WeekState,
  action: PayloadAction<InsertBelowPayload>
) => {
  weekAdapter.addOne(state, action.payload.newModel)
}

const removeEntityById = (
  state: WeekState,
  action: PayloadAction<WeekPayload>
) => {
  weekAdapter.removeOne(state, action.payload.id)
}

const toggleArchiveEntity = (
  state: WeekState,
  action: PayloadAction<{ id: number }>
) => {
  const entity = state.entities[action.payload.id]
  if (entity) {
    weekAdapter.updateOne(state, {
      id: action.payload.id,
      changes: {
        deleted: !entity.deleted,
        deletedOn: entity.deleted ? undefined : 'This session'
      }
    })
  }
}

const newNode = (
  state: ReturnType<typeof weekAdapter.getInitialState>,
  action: PayloadAction<NodeGenericPayload>
) => {
  const { parentId, index, newThrough } = action.payload

  // Find the parent entity and update its nodeweekSet
  const parentEntity = state.entities[parentId]
  if (parentEntity) {
    const updatedSet = [...parentEntity.nodeweekSet]
    updatedSet.splice(index, 0, newThrough.id) // Insert the new node at the specified index

    weekAdapter.updateOne(state, {
      id: parentId,
      changes: { nodeweekSet: updatedSet }
    })
  }
}

const movedTo = (
  state: ReturnType<typeof weekAdapter.getInitialState>,
  action: PayloadAction<MovedToPayload>
) => {
  const { id, newParent, newIndex } = action.payload

  // Find and update the entity to remove the `id` from its `nodeweekSet`
  Object.values(state.entities).forEach((entity) => {
    if (entity && entity.nodeweekSet.includes(id)) {
      const updatedSet = entity.nodeweekSet.filter((nodeId) => nodeId !== id)
      weekAdapter.updateOne(state, {
        id: entity.id,
        changes: { nodeweekSet: updatedSet }
      })
    }
  })

  // Add the `id` to the new parent's `nodeweekSet` at the specified index
  const newParentEntity = state.entities[newParent]
  if (newParentEntity) {
    const updatedSet = [...newParentEntity.nodeweekSet]
    updatedSet.splice(newIndex, 0, id)
    weekAdapter.updateOne(state, {
      id: newParent,
      changes: { nodeweekSet: updatedSet }
    })
  }
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
  name: SliceNamespace.WEEK,
  initialState,

  reducers: {
    updateMany(state, action: PayloadAction<Update<TWeek, number>[]>) {
      weekAdapter.updateMany(state, action.payload)
    },
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
    },

    // reorder week nodes on workflow view node drag
    moveNode: (
      state,
      action: PayloadAction<{ id: number; fromWeek: number; toWeek: number }>
    ) => {
      const { id, fromWeek, toWeek } = action.payload
      const sourceIndex = state.entities[fromWeek].nodes.indexOf(id)
      state.entities[fromWeek].nodes.splice(sourceIndex, 1)
      state.entities[toWeek].nodes.push(id)
    }
  },
  extraReducers: (builder) => {
    builder
      /*******************************************************
       * COMMON
       *******************************************************/
      .addCase(replaceStoreData, (state, action) => {
        if (action.payload.week) {
          weekAdapter.setAll(state, action.payload.week)
        }
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
  updateMany: updateManyWeeks,
  createLock: weekCreateLock,
  reloadComments: weekReloadComments,
  changeField: weekChangeField,
  insertBelow: weekInsertBelow,
  deleteSelf: weekDeleteSelf,
  deleteSelfSoft: weekDeleteSelfSoft,
  restoreSelf: weekRestoreSelf,
  changeId: weekChangeId,
  movedTo: weekMovedTo,
  moveNode: weekMoveNode
} = weekSlice.actions

export default weekSlice.reducer
