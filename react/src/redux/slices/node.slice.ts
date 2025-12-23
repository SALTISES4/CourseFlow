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
  mode?: 'row' | 'column'
  edge?: 'top' | 'bottom'
  id: number
  fromWeek: number
  toWeek: number
  toColumn: number
  toRow: number
}

export type NodeInsertMode = 'manual' | 'row' | 'column'

export const nodeAdapter = createEntityAdapter<TNode>()
type NodeState = ReturnType<typeof nodeAdapter.getInitialState> & {
  insertMode: NodeInsertMode
}
const initialState: NodeState = {
  ...nodeAdapter.getInitialState(),
  insertMode: 'manual'
}

/*******************************************************
 * Reusable Reducer Functions
 *******************************************************/
const updateEntity = (
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

const getNewNodeId = (ids: number[]): number => {
  const lastId = ids.reduce((acc, curr) => {
    return acc > curr ? acc : curr
  }, 0)

  return lastId + 1
}

// returns groups of nodes based on the coordinates affected
// before - gorup of nodes before the current row/column
// after - group of nodes after the current row/colun
const splitWorkflowGridNodes = ({
  ids,
  entities,
  column,
  newRow
}: {
  ids: number[]
  entities: typeof initialState.entities
  column?: number
  newRow: number
}) => {
  const before: number[] = []
  const after: number[] = []

  ids.forEach((nodeId) => {
    const n = entities[nodeId]
    const columnMatch = column !== undefined ? n.column === column : true

    if (columnMatch && n.order >= newRow) {
      after.push(nodeId)
    }

    if (columnMatch && n.order < newRow) {
      before.push(nodeId)
    }
  })

  return { before, after }
}

// figure out whether a row needs to be collapsed or not
const getCollapsedWeekRow = ({
  ids,
  entities,
  oldRow,
  newRow,
  columnMode
}: {
  ids: number[]
  entities: typeof initialState.entities
  oldRow: number
  newRow: number
  columnMode: boolean
}): number | null => {
  const sameRow = ids.filter((nodeId) => entities[nodeId].order === oldRow)
  const columnCheck = columnMode ? oldRow !== newRow : true
  return !sameRow.length && columnCheck ? oldRow : null
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
    changeInsertMode(state, action: PayloadAction<NodeState['insertMode']>) {
      state.insertMode = action.payload
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

    workflowNodeInsert: (
      state,
      action: PayloadAction<{ id: number; duplicate?: boolean }>
    ) => {
      const { id, duplicate } = action.payload
      const node = state.entities[id]

      const weekNodes = state.ids.filter(
        (nodeId) =>
          nodeId !== node.id && state.entities[nodeId].week === node.week
      )

      const gridSplits = splitWorkflowGridNodes({
        ids: weekNodes,
        entities: state.entities,
        newRow: node.order + 1
      })

      const clone = { ...node }
      nodeAdapter.addOne(state, {
        ...clone,
        id: getNewNodeId(state.ids),
        title: _t('Blank title'),
        order: clone.order + 1,
        comments: [],
        ...(duplicate && {
          title: `${clone.title} (copy)`
        })
      })

      // bump nodes by one row down
      gridSplits.after.forEach((nodeId) => {
        state.entities[nodeId].order += 1
      })
    },

    workflowNodeDelete: (state, action: PayloadAction<{ id: number }>) => {
      const { id } = action.payload
      const node = state.entities[id]

      const weekNodes = state.ids.filter(
        (nodeId) =>
          nodeId !== node.id && state.entities[nodeId].week === node.week
      )

      const collapseRow = getCollapsedWeekRow({
        ids: weekNodes,
        entities: state.entities,
        oldRow: node.order,
        newRow: node.order,
        columnMode: undefined
      })

      nodeAdapter.removeOne(state, action.payload.id)

      if (collapseRow !== null) {
        splitWorkflowGridNodes({
          ids: weekNodes,
          entities: state.entities,
          newRow: node.order
        }).after.forEach((nodeId) => {
          state.entities[nodeId].order -= 1
        })
      }
    },

    // when node is moved in the workflow edit view
    // update order/column attributes, but also check if other nodes
    // need to be moved around as well (ie, node inserted between two rows, etc)
    workflowNodeReorder: (
      state,
      action: PayloadAction<NodeWorkflowReorderPayload>
    ) => {
      const { mode, edge, id, fromWeek, toWeek, toColumn, toRow } =
        action.payload
      const insertMode = mode ?? state.insertMode
      const insertModeRow = insertMode === 'row'
      const insertModeColumn = insertMode === 'column'
      const movedNode = state.entities[id]
      const oldRow = movedNode.order
      let newRow = toRow

      if (insertModeColumn) {
        newRow = !edge // yuck
          ? toRow
          : edge === 'top'
            ? Math.max(0, toRow - 1)
            : toRow + 1
      }

      if (insertModeRow) {
        newRow = edge === 'top' ? toRow : toRow + 1
      }

      const fromWeekNodes = state.ids.filter(
        (nodeId) => nodeId !== id && state.entities[nodeId].week === fromWeek
      )

      const toWeekNodes =
        fromWeek === toWeek
          ? fromWeekNodes
          : state.ids.filter(
              (nodeId) =>
                nodeId !== id && state.entities[nodeId].week === toWeek
            )

      const gridSplits = splitWorkflowGridNodes({
        ids: toWeekNodes,
        entities: state.entities,
        newRow,
        column: insertModeColumn ? toColumn : undefined
      })

      const collapseRow = getCollapsedWeekRow({
        ids: fromWeekNodes,
        entities: state.entities,
        oldRow,
        newRow,
        columnMode: insertModeColumn
      })

      // for the columns, when there's no row collapsing
      // iterate over same column nodes and chain bump them if necessary
      if (insertModeColumn && collapseRow === null) {
        let currRow = newRow
        const sorted = gridSplits.after.sort((nodeA, nodeB) => {
          return state.entities[nodeA].order - state.entities[nodeB].order
        })

        for (let i = 0; i < sorted.length; i++) {
          const node = state.entities[sorted[i]]
          if (node.order === currRow) {
            currRow += 1
            node.order = currRow
          } else {
            break // stop chain bumping as soon as the first node doesn't need to move
          }
        }
      }

      if (collapseRow !== null) {
        // the new row is actually -1 due to the collapse
        // ... but only if it happened in the same week
        newRow = fromWeek === toWeek && newRow > oldRow ? newRow - 1 : newRow

        // collapse the source week rows to account for the collapse
        fromWeekNodes.forEach((nodeId) => {
          const n = state.entities[nodeId]
          if (n.order > collapseRow) {
            n.order -= 1
          }
        })

        // and finally bump up the "after" rows for the destination week
        gridSplits.after.forEach((nodeId) => {
          state.entities[nodeId].order += 1
        })
      }

      movedNode.order = newRow
      movedNode.column = toColumn
      movedNode.week = toWeek
    },

    // add/remove linked outcomes
    workfowLinkOutcome: (
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
    },

    // this one had a jquery update side effect
    //  ThemeHelper.triggerHandlerEach($('.week .node'), 'component-updated')
    restoreSelf: toggleArchiveEntity,
    newNode(state, action: PayloadAction<{ newModel: TNode }>) {
      nodeAdapter.addOne(state, action.payload.newModel)
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
        NodelinkActions.RESTORE_SELF as string,
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
        NodelinkActions.NEW_NODE_LINK as string,
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
      .addCase(NodelinkActions.DELETE_SELF_SOFT as string, deleteOutgoingLinks)
      .addCase(NodelinkActions.DELETE_SELF as string, deleteOutgoingLinks)

    /*******************************************************
     * STRATEGY
     *******************************************************/
    builder
      .addCase(
        StrategyActions.ADD_STRATEGY as string,
        (state, action: PayloadAction<{ nodesAdded: TNode[] }>) => {
          return state.concat(action.payload.nodesAdded)
        }
      )
      /*******************************************************
       * OUTCOME
       *******************************************************/
      .addCase(OutcomeActions.DELETE_SELF as string, updateItem)

      .addCase(OutcomeActions.DELETE_SELF_SOFT as string, updateItem)
      .addCase(OutcomeActions.RESTORE_SELF as string, updateItem)
      .addCase(OutcomeBaseActions.DELETE_SELF as string, updateItem)
      .addCase(OutcomeBaseActions.DELETE_SELF_SOFT as string, updateItem)
      .addCase(OutcomeBaseActions.RESTORE_SELF as string, updateItem)

      .addCase(OutcomeActions.INSERT_CHILD as string, updatingNodeSet)
      .addCase(OutcomeActions.INSERT_BELOW as string, updatingNodeSet)
      .addCase(OutcomeBaseActions.INSERT_CHILD as string, updatingNodeSet)
      .addCase(OutcomeOutcomeActions.CHANGE_ID as string, updatingNodeSet)

    /*******************************************************
     * OUTCOME NODE
     *******************************************************/
    //@todo needs review
    builder.addCase(
      OutcomeNodeActions.UPDATE_DEGREE as string,
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
        ColumnActions.DELETE_SELF as string,
        (state, action: PayloadAction<DeleteColumnAction>) => {
          return state.map((item) => {
            if (item.column === action.payload.id) {
              item.column = action.payload.extraData
            }
          })
        }
      )
      .addCase(
        ColumnActions.DELETE_SELF_SOFT as string,
        (state, action: PayloadAction<DeleteColumnAction>) => {
          return state.map((item) => {
            if (item.column === action.payload.id) {
              item.column = action.payload.extraData
            }
          })
        }
      )
      .addCase(
        ColumnActions.RESTORE_SELF as string,
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
      WeekActions.INSERT_BELOW as string,
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
  changeInsertMode: nodeChangeInsertMode,
  deleteSelf: nodeDeleteSelf,
  deleteSelfSoft: nodeDeleteSelfSoft,
  restoreSelf: nodeRestoreSelf,
  insertBelow: nodeInsertBelow,
  reloadComments: nodeReloadComments,
  setLinkedWorkflow: nodeSetLinkedWorkflow,

  // workflow view
  workfowLinkOutcome: nodelinkOutcome,
  workflowNodeReorder: nodeWorkflowReorder,
  workflowNodeInsert: nodeWorkflowInsert,
  workflowNodeDelete: nodeWorkflowDelete
} = nodeSlice.actions

export default nodeSlice.reducer
