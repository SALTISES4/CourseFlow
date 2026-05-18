import { _t } from '@cf/utility/Utility.class'
import {
  CommonActions,
  NodeActions,
  SliceNamespace,
  StrategyActions
} from '@cfRedux/types/enumActions'
import { TSection, WorkspaceAppState } from '@cfRedux/types/type'
import {
  PayloadAction,
  Update,
  createAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

interface SectionPayload {
  uuid: string
  json?: any
  [key: string]: any
}

interface InsertBelowPayload {
  newModel: TSection
}

interface ChangeIdPayload {
  oldId: string
  newId: string
}

interface MovedToPayload {
  uuid: string
  newParent: number
  newIndex: number
}

interface NodeGenericPayload {
  uuid: string
  index: number
  parentId: string
  newThrough: { uuid: string }
}

export const sectionAdapter = createEntityAdapter<TSection>()
type SectionState = ReturnType<typeof sectionAdapter.getInitialState>
const initialState = sectionAdapter.getInitialState()

export const updateEntity = (
  state: SectionState,
  action: PayloadAction<{ uuid: string; data: Partial<TSection> }>
) => {
  sectionAdapter.updateOne(state, {
    uuid: action.payload.uuid,
    changes: action.payload.data
  })
}

const createEntity = (
  state: SectionState,
  action: PayloadAction<InsertBelowPayload>
) => {
  sectionAdapter.addOne(state, action.payload.newModel)
}

const removeEntityById = (
  state: SectionState,
  action: PayloadAction<SectionPayload>
) => {
  sectionAdapter.removeOne(state, action.payload.uuid)
}

const toggleArchiveEntity = (
  state: SectionState,
  action: PayloadAction<{ uuid: string }>
) => {
  const entity = state.entities[action.payload.uuid]
  if (entity) {
    sectionAdapter.updateOne(state, {
      uuid: action.payload.uuid,
      changes: {
        deleted: !entity.deleted,
        deletedOn: entity.deleted ? undefined : 'This session'
      }
    })
  }
}

const newNode = (
  state: ReturnType<typeof sectionAdapter.getInitialState>,
  action: PayloadAction<NodeGenericPayload>
) => {
  const { parentId, index, newThrough } = action.payload

  // Find the parent entity and update its nodesectionSet
  const parentEntity = state.entities[parentId]
  if (parentEntity) {
    const updatedSet = [...parentEntity.nodesectionSet]
    updatedSet.splice(index, 0, newThrough.uuid) // Insert the new node at the specified index

    sectionAdapter.updateOne(state, {
      uuid: parentId,
      changes: { nodesectionSet: updatedSet }
    })
  }
}

const movedTo = (
  state: ReturnType<typeof sectionAdapter.getInitialState>,
  action: PayloadAction<MovedToPayload>
) => {
  const { id, newParent, newIndex } = action.payload

  // Find and update the entity to remove the `id` from its `nodesectionSet`
  Object.values(state.entities).forEach((entity) => {
    if (entity && entity.nodesectionSet.includes(id)) {
      const updatedSet = entity.nodesectionSet.filter((nodeId) => nodeId !== id)
      sectionAdapter.updateOne(state, {
        uuid: entity.uuid,
        changes: { nodesectionSet: updatedSet }
      })
    }
  })

  // Add the `id` to the new parent's `nodesectionSet` at the specified index
  const newParentEntity = state.entities[newParent]
  if (newParentEntity) {
    const updatedSet = [...newParentEntity.nodesectionSet]
    updatedSet.splice(newIndex, 0, id)
    sectionAdapter.updateOne(state, {
      uuid: newParent,
      changes: { nodesectionSet: updatedSet }
    })
  }
}

/*******************************************************
 * CREATE ACTIONS
 *******************************************************/
const replaceStoreData = createAction<{
  section: WorkspaceAppState['section'] | undefined
}>(CommonActions.REPLACE_STOREDATA)

const refreshStoreData = createAction<{
  section: WorkspaceAppState['section'] | undefined
}>(CommonActions.REFRESH_STOREDATA)

/*******************************************************
 * SLICE
 *******************************************************/
const sectionSlice = createSlice({
  name: SliceNamespace.WEEK,
  initialState,

  reducers: {
    updateMany(state, action: PayloadAction<Update<TSection, number>[]>) {
      sectionAdapter.updateMany(state, action.payload)
    },
    insertBelow(
      state,
      action: PayloadAction<{
        uuid: string
        newId: string
        duplicate?: boolean
      }>
    ) {
      const { id, newId, duplicate } = action.payload

      const section = duplicate
        ? state.entities[id]
        : state.entities[state.uuids[0]]
      const clone = { ...section }
      const cloneTitle = section.title?.length
        ? section.title
        : section.sectionTypeDisplay

      sectionAdapter.addOne(state, {
        ...clone,
        uuid: newId,
        title: _t('Blank title'),
        ...(duplicate && {
          title: `${cloneTitle} (copy)`
        })
      })
    },
    reloadComments: updateEntity,
    deleteSelf: removeEntityById,
    // MISC
    createLock: updateEntity,
    deleteSelfSoft: toggleArchiveEntity,
    restoreSelf: toggleArchiveEntity,
    movedTo(state, action: PayloadAction<MovedToPayload>) {
      return state.map((item) => {
        const newSet = item.nodesectionSet.filter(
          (id) => id !== action.payload.uuid
        )
        if (item.uuid === action.payload.newParent) {
          newSet.splice(action.payload.newIndex, 0, action.payload.uuid)
          return { ...item, nodesectionSet: newSet }
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
        nodesectionSet: item.nodesectionSet.map((id) =>
          id === action.payload.oldId ? action.payload.newId : id
        )
      }))
    },

    // reorder section nodes on workflow view node drag
    moveNode: (
      state,
      action: PayloadAction<{
        uuid: string
        fromSection: string
        toSection: string
      }>
    ) => {
      const { id, fromSection, toSection } = action.payload
      const sourceIndex = state.entities[fromSection].nodes.indexOf(id)
      state.entities[fromSection].nodes.splice(sourceIndex, 1)
      state.entities[toSection].nodes.push(id)
    }
  },
  extraReducers: (builder) => {
    builder
      /*******************************************************
       * COMMON
       *******************************************************/
      .addCase(replaceStoreData, (state, action) => {
        if (action.payload.section) {
          sectionAdapter.setAll(state, action.payload.section)
        }
      })
      .addCase(refreshStoreData, (state, action) => {
        if (action.payload.section) {
          sectionAdapter.upsertMany(state, action.payload.section)
        }
      })
      /*******************************************************
       * STRATEGY
       *******************************************************/
      .addCase(StrategyActions.TOGGLE_STRATEGY as string, updateEntity)
      .addCase(StrategyActions.ADD_STRATEGY as string, createEntity)

    /*******************************************************
     * NODE
     *******************************************************/
    // i don;t think this one makes sense
    builder
      .addCase(NodeActions.DELETE_SELF_SOFT as string, removeEntityById)
      .addCase(NodeActions.RESTORE_SELF as string, newNode)
      .addCase(NodeActions.NEW_NODE as string, newNode)
      .addCase(NodeActions.INSERT_BELOW as string, newNode)
    /*******************************************************
     * NODEWEEK
     * // @todo needs review
     *******************************************************/
    // builder
    //   .addCase(
    //     NodeSectionActions.CHANGE_ID,
    //     (state, action: PayloadAction<RefreshStoreDataPayload>) => {
    //       return state.map((item) => ({
    //         ...item,
    //         nodesectionSet: item.nodes.map((id) =>
    //           id === action.payload.oldId ? action.payload.newId : id
    //         )
    //       }))
    //     }
    //   )
    //   .addCase(
    //     NodeSectionActions.MOVED_TO,
    //     (state, action: PayloadAction<RefreshStoreDataPayload>) => {
    //       return state.map((item) => {
    //         const newSet = item.nodes.filter((id) => id !== action.payload.uuid)
    //         if (item.uuid === action.payload.newParent) {
    //           newSet.splice(action.payload.newIndex, 0, action.payload.uuid)
    //           return { ...item, nodesectionSet: newSet }
    //         }
    //         return item
    //       })
    //     }
    //   )
  }
})

export const {
  updateMany: updateManySections,
  createLock: sectionCreateLock,
  reloadComments: sectionReloadComments,
  changeField: sectionChangeField,
  deleteSelf: sectionDeleteSelf,
  deleteSelfSoft: sectionDeleteSelfSoft,
  restoreSelf: sectionRestoreSelf,
  changeId: sectionChangeId,
  movedTo: sectionMovedTo,
  moveNode: sectionMoveNode
} = sectionSlice.actions

export default sectionSlice.reducer
