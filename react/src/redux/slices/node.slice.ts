import { _t } from '@cf/utility/Utility.class'
import {
  ColumnActions,
  CommonActions,
  NodelinkActions,
  OutcomeActions,
  OutcomeBaseActions,
  OutcomeNodeActions,
  OutcomeOutcomeActions,
  SliceNamespace,
  StrategyActions,
  WeekActions
} from '@cfRedux/types/enumActions'
import { TNode, WorkspaceAppState } from '@cfRedux/types/type'
import {
  PayloadAction,
  Update,
  createAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

interface DeleteColumnAction {
  id: number
  extraData: any
}

export type NodeWorkflowReorderPayload = {
  edge?: 'top' | 'bottom'
  mode?: 'row' | 'column'
  id: number
  fromWeek: number
  toWeek: number
  toColumn: number
  toRow: number
}

export const nodeAdapter = createEntityAdapter<TNode>()
type NodeState = ReturnType<typeof nodeAdapter.getInitialState>
const initialState = nodeAdapter.getInitialState()

/*******************************************************
 * Reusable Reducer Functions
 *******************************************************/
export const updateEntity = (
  state: NodeState,
  action: PayloadAction<{ id: number; data: Partial<TNode> }>
) => {
  nodeAdapter.updateOne(state, {
    id: action.payload.id,
    changes: action.payload.data
  })
}

const removeEntityById = (
  state: NodeState,
  action: PayloadAction<{ id: number }>
) => {
  nodeAdapter.removeOne(state, action.payload.id)
}

const toggleArchiveEntity = (
  state: NodeState,
  action: PayloadAction<{ id: number }>
) => {
  const entity = state.entities[action.payload.id]
  if (entity) {
    nodeAdapter.updateOne(state, {
      id: action.payload.id,
      changes: {
        deleted: !entity.deleted,
        deletedOn: entity.deleted ? undefined : _t('This session')
      }
    })
  }
}

const deleteOutgoingLinks = (
  state: NodeState,
  action: PayloadAction<{ id: number }>
) => {
  const entitiesToUpdate = Object.values(state.entities).filter((entity) =>
    entity?.outgoingLinks.includes(action.payload.id)
  )

  const updates = entitiesToUpdate.map((entity) => ({
    id: entity.id,
    changes: {
      outgoingLinks: entity.outgoingLinks.filter(
        (linkId) => linkId !== action.payload.id
      )
    }
  }))

  nodeAdapter.updateMany(state, updates)
}

const updatingNodeSet = (
  state: NodeState,
  action: PayloadAction<{
    nodeUpdates: {
      id: number
      outcomenodeSet: any[]
      outcomenodeUniqueSet: any[]
    }[]
  }>
) => {
  if (action.payload.nodeUpdates.length === 0) {
    return
  }

  const updates = action.payload.nodeUpdates.map((update) => ({
    id: update.id,
    changes: {
      outcomenodeSet: update.outcomenodeSet,
      outcomenodeUniqueSet: update.outcomenodeUniqueSet
    }
  }))

  nodeAdapter.updateMany(state, updates)
}

const splitWorkflowGridNodes = ({
  ids,
  entities,
  column,
  row
}: {
  ids: number[]
  entities: typeof initialState.entities
  column?: number
  row: number
}) => {
  return ids.filter((nodeId) => {
    const n = entities[nodeId]
    const columnMatch = column !== undefined ? n.column === column : true
    return columnMatch && n.order >= row
  })
}

/*******************************************************
 * TO DO
 *******************************************************/

// @todo needs review
const updateItem = (state, action: PayloadAction<{ extraData: any[] }>) => {
  return state.map((item) => {
    const update = action.payload.extraData.find(
      (updateItem) => updateItem.id === item.id
    )
    return update ? { ...item, ...update } : item
  })
}

/*******************************************************
 * ACTIONS
 *******************************************************/

// not sure what this is doing yet
export const replaceStoreData = createAction<{
  node: WorkspaceAppState['node'] | undefined
}>(CommonActions.REPLACE_STOREDATA)

export const refreshStoreData = createAction<{
  node: WorkspaceAppState['node'] | undefined
}>(CommonActions.REFRESH_STOREDATA)

/*******************************************************
 * SLICE
 *******************************************************/
const nodeSlice = createSlice({
  name: SliceNamespace.NODE,
  initialState,
  reducers: {
    updateMany(state, action: PayloadAction<Update<TNode, number>[]>) {
      nodeAdapter.updateMany(state, action.payload)
    },
    changedColumn: updateEntity,
    createLock: updateEntity,
    changeField: updateEntity,
    deleteSelf: removeEntityById,
    deleteSelfSoft: toggleArchiveEntity,
    insertBelow(state, action: PayloadAction<{ newModel: TNode }>) {
      nodeAdapter.addOne(state, action.payload.newModel)
    },
    reloadComments(
      state,
      action: PayloadAction<{ id: number; commentData: any }>
    ) {
      nodeAdapter.updateOne(state, {
        id: action.payload.id,
        changes: { comments: action.payload.commentData }
      })
    },
    setLinkedWorkflow(
      state,
      action: PayloadAction<{
        id: number
        linkedWorkflow: any
        linkedWorkflowData: any
      }>
    ) {
      nodeAdapter.updateOne(state, {
        id: action.payload.id,
        changes: {
          linkedWorkflow: action.payload.linkedWorkflow,
          linkedWorkflowData: action.payload.linkedWorkflowData
        }
      })
    },

    // when node is moved in the workflow edit view
    // update order/column attributes, but also check if other nodes
    // need to be moved around as well (ie, node inserted between two rows, etc)
    workflowReorder: (
      state,
      action: PayloadAction<NodeWorkflowReorderPayload>
    ) => {
      const {
        mode = 'column',
        edge = 'top',
        id,
        toWeek,
        toColumn,
        toRow
      } = action.payload

      const movedNode = state.entities[id]
      const otherWeekNodes = state.ids.filter(
        (nodeId) => nodeId !== id && state.entities[nodeId].week === toWeek
      )

      // "row" insert moves all the other week nodes below this row
      // "column" works the same as row, but contained within the current column
      const otherNodes = splitWorkflowGridNodes({
        ids: otherWeekNodes,
        entities: state.entities,
        row: edge === 'top' ? toRow : toRow + 1,
        column: mode === 'column' ? toColumn : undefined
      })

      // loop through other nodes, only updating order of the nodes
      // between the "current" and the "new" row
      otherNodes.forEach((nodeId) => {
        const node = state.entities[nodeId]
        if (movedNode.order >= node.order) {
          node.order += 1
        }
      })

      // finally update the dragged node's properties
      movedNode.order = toRow
      movedNode.column = toColumn
      movedNode.week = toWeek
    },

    // this one had a jquery update side effect
    //  ThemeHelper.triggerHandlerEach($('.week .node'), 'component-updated')
    restoreSelf: toggleArchiveEntity,
    newNode(state, action: PayloadAction<{ newModel: TNode }>) {
      nodeAdapter.addOne(state, action.payload.newModel)
    },

    // add/remove linked outcomes
    linkOutcome: (
      state,
      action: PayloadAction<{
        outcomeId: number
        nodeId: number
      }>
    ) => {
      const { outcomeId, nodeId } = action.payload
      const node = state.entities[nodeId]

      if (!node) {
        return
      }

      if (!node.outcomenodeSet) {
        node.outcomenodeSet = [outcomeId]
      } else {
        const index = node.outcomenodeSet?.indexOf(outcomeId)
        if (index !== -1) {
          node.outcomenodeSet.splice(index, 1)
        } else {
          node.outcomenodeSet.push(outcomeId)
        }
      }
    }
  },
  extraReducers: (builder) => {
    /*******************************************************
     * COMMON
     *******************************************************/
    builder
      .addCase(replaceStoreData, (state, action) => {
        if (action.payload.node) {
          nodeAdapter.setAll(state, action.payload.node)
        }
      })
      .addCase(refreshStoreData, (state, action) => {
        if (action.payload.node) {
          nodeAdapter.upsertMany(state, action.payload.node)
        }
      })
    /*******************************************************
     * NODE LINK
     *******************************************************/
    builder
      .addCase(
        NodelinkActions.RESTORE_SELF,
        (state, action: PayloadAction<{ parentId: number; id: number }>) => {
          return state.map((item) =>
            item.id === action.payload.parentId
              ? {
                  ...item,
                  outgoingLinks: [...item.outgoingLinks, action.payload.id]
                }
              : item
          )
        }
      )
      // @todo needs review
      .addCase(
        NodelinkActions.NEW_NODE_LINK,
        (state, action: PayloadAction<{ parentId: number; id: number }>) => {
          return state.map((item) => {
            if (item.id === action.payload.newModel.sourceNode) {
              return {
                ...item,
                outgoingLinks: [
                  ...item.outgoingLinks,
                  action.payload.newModel.id
                ]
              }
            }
            return item
          })
        }
      )
      .addCase(NodelinkActions.DELETE_SELF_SOFT, deleteOutgoingLinks)
      .addCase(NodelinkActions.DELETE_SELF, deleteOutgoingLinks)

    /*******************************************************
     * STRATEGY
     *******************************************************/
    builder
      .addCase(
        StrategyActions.ADD_STRATEGY,
        (state, action: PayloadAction<{ nodesAdded: TNode[] }>) => {
          return state.concat(action.payload.nodesAdded)
        }
      )
      /*******************************************************
       * OUTCOME
       *******************************************************/
      .addCase(OutcomeActions.DELETE_SELF, updateItem)

      .addCase(OutcomeActions.DELETE_SELF_SOFT, updateItem)
      .addCase(OutcomeActions.RESTORE_SELF, updateItem)
      .addCase(OutcomeBaseActions.DELETE_SELF, updateItem)
      .addCase(OutcomeBaseActions.DELETE_SELF_SOFT, updateItem)
      .addCase(OutcomeBaseActions.RESTORE_SELF, updateItem)

      .addCase(OutcomeActions.INSERT_CHILD, updatingNodeSet)
      .addCase(OutcomeActions.INSERT_BELOW, updatingNodeSet)
      .addCase(OutcomeBaseActions.INSERT_CHILD, updatingNodeSet)
      .addCase(OutcomeOutcomeActions.CHANGE_ID, updatingNodeSet)

    /*******************************************************
     * OUTCOME NODE
     *******************************************************/
    //@todo needs review
    builder.addCase(
      OutcomeNodeActions.UPDATE_DEGREE,
      (state, action: PayloadAction<any>) => {
        if (action.payload.outcomenode === -1) {
          return state
        }

        return state.map((item) => {
          return item.id === action.payload.dataPackage[0].node
            ? {
                ...item,
                outcomenodeSet: action.payload.newOutcomenodeSet,
                outcomenodeUniqueSet: action.payload.newOutcomenodeUniqueSet
              }
            : item
        })
      }
    )

    /*******************************************************
     * COLUMN
     * add the coluns trigger
     *  ThemeHelper.triggerHandlerEach($('.week .node'), 'component-updated')
     *******************************************************/
    // Column Actions
    builder
      .addCase(
        ColumnActions.DELETE_SELF,
        (state, action: PayloadAction<DeleteColumnAction>) => {
          return state.map((item) => {
            if (item.column === action.payload.id) {
              item.column = action.payload.extraData
            }
          })
        }
      )
      .addCase(
        ColumnActions.DELETE_SELF_SOFT,
        (state, action: PayloadAction<DeleteColumnAction>) => {
          return state.map((item) => {
            if (item.column === action.payload.id) {
              item.column = action.payload.extraData
            }
          })
        }
      )
      .addCase(
        ColumnActions.RESTORE_SELF,
        (state, action: PayloadAction<DeleteColumnAction>) => {
          return state.map((item) => {
            if (action.payload.extraData.includes(item.id)) {
              item.column = action.payload.id
            }
          })
        }
      )
    /*******************************************************
     * WEEK
     *******************************************************/
    builder.addCase(
      WeekActions.INSERT_BELOW,
      (state, action: PayloadAction<{ children: { node: TNode[] } }>) => {
        if (action.payload.children) {
          return state.push(...action.payload.children.node)
        }
      }
    )
  }
})

export const {
  updateMany: updateManyNodes,
  changedColumn: nodeChangedColumn,
  createLock: nodeCreateLock,
  changeField: nodeChangeField,
  deleteSelf: nodeDeleteSelf,
  deleteSelfSoft: nodeDeleteSelfSoft,
  restoreSelf: nodeRestoreSelf,
  insertBelow: nodeInsertBelow,
  reloadComments: nodeReloadComments,
  workflowReorder: nodeWorkflowReorder,
  setLinkedWorkflow: nodeSetLinkedWorkflow,
  linkOutcome: nodelinkOutcome
} = nodeSlice.actions

export default nodeSlice.reducer
