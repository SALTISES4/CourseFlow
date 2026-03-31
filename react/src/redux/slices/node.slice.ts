import { ELibraryObject } from '@cf/HTTP/XMLHTTP/types/entity'
import { _t } from '@cf/utility/Utility.class'
import {
  ColumnActions,
  CommonActions,
  OutcomeActions,
  OutcomeBaseActions,
  OutcomeOutcomeActions,
  SliceNamespace,
  StrategyActions
} from '@cfRedux/types/enumActions'
import { TNode, WorkspaceAppState } from '@cfRedux/types/type'
import {
  PayloadAction,
  Update,
  createAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import { getNextLargestNumber } from '../selectors/helpers'

interface DeleteColumnAction {
  id: string
  extraData: any
}

export type NodeWorkflowReorderPayload = {
  mode?: 'row' | 'column'
  edge?: 'top' | 'bottom'
  id: string
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
  action: PayloadAction<{ id: string; data: Partial<TNode> }>
) => {
  nodeAdapter.updateOne(state, {
    id: action.payload.id,
    changes: action.payload.data
  })
}

const removeEntityById = (
  state: NodeState,
  action: PayloadAction<{ id: string }>
) => {
  nodeAdapter.removeOne(state, action.payload.id)
}

const toggleArchiveEntity = (
  state: NodeState,
  action: PayloadAction<{ id: string }>
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

const updatingNodeSet = (
  state: NodeState,
  action: PayloadAction<{
    nodeUpdates: {
      id: string
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
    if (n.deleted) {
      return
    }

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
  from,
  to,
  columnMode
}: {
  ids: number[]
  entities: typeof initialState.entities
  from: { week: number; row: number }
  to: { week: number; row: number }
  columnMode?: boolean
}): number | null => {
  const sameRow = ids.filter((nodeId) => {
    const n = entities[nodeId]
    return n.deleted === false && n.order === from.row
  })
  const columnCheck = columnMode
    ? from.week !== to.week || (from.week === to.week && from.row !== to.row)
    : true
  return !sameRow.length && columnCheck ? from.row : null
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
    insertBelow(state, action: PayloadAction<{ newModel: TNode }>) {
      nodeAdapter.addOne(state, action.payload.newModel)
    },
    changeInsertMode(state, action: PayloadAction<NodeState['insertMode']>) {
      state.insertMode = action.payload
    },
    reloadComments(
      state,
      action: PayloadAction<{ id: string; commentData: any }>
    ) {
      nodeAdapter.updateOne(state, {
        id: action.payload.id,
        changes: { comments: action.payload.commentData }
      })
    },

    setLinkedWorkflow(
      state,
      action: PayloadAction<{
        nodeid: string
        workflowid: string
        workflowData: ELibraryObject
        representsWorkflow?: boolean
      }>
    ) {
      const { nodeId, workflowId, workflowData, representsWorkflow } =
        action.payload

      nodeAdapter.updateOne(state, {
        id: nodeId,
        changes: {
          linkedWorkflow: workflowId,
          linkedWorkflowData: workflowData,
          ...(representsWorkflow !== undefined && {
            representsWorkflow
          })
        }
      })
    },

    // with nodeId
    // - used to insert a new node with regards to the insert mode and
    //   whether it's duplicating an existing node or not
    // with columnID
    // - used to insert a new node into an entirely new column into a specific position
    workflowNodeInsert: (
      state,
      action: PayloadAction<
        | {
            nodeid: string
            mode: NodeWorkflowReorderPayload['mode']
            duplicate?: boolean
          }
        | {
            newColumn?: boolean
            columnid: string
            weekid: string
            row: number
          }
      >
    ) => {
      if ('columnId' in action.payload) {
        const { newColumn, columnId, weekId, row } = action.payload
        const weekNodes = state.ids.filter(
          (nodeId) => state.entities[nodeId].week === weekId
        )

        const gridSplits = splitWorkflowGridNodes({
          ids: weekNodes,
          entities: state.entities,
          newRow: row,
          column: newColumn ? -1 : undefined
        })

        // grab any existing node
        const clone = state.entities[state.ids[0]]
        nodeAdapter.addOne(state, {
          ...clone,
          id: getNextLargestNumber(state.ids),
          title: _t('Blank title'),
          order: row,
          week: weekId,
          column: columnId,
          deleted: false,
          taskClassification: -1,
          contextClassification: -1,
          comments: []
        })

        // bump nodes by one row down
        gridSplits.after.forEach((nodeId) => {
          state.entities[nodeId].order += 1
        })
      }

      if ('nodeId' in action.payload) {
        const { nodeId, mode, duplicate } = action.payload
        const node = state.entities[nodeId]

        const weekNodes = state.ids.filter(
          (nodeId) =>
            nodeId !== node.id && state.entities[nodeId].week === node.week
        )

        const gridSplits = splitWorkflowGridNodes({
          ids: weekNodes,
          entities: state.entities,
          newRow: node.order + 1,
          column: mode === 'column' ? node.column : undefined
        })

        const clone = { ...node }
        nodeAdapter.addOne(state, {
          ...clone,
          id: getNextLargestNumber(state.ids),
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
      }
    },

    workflowNodeDelete: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload
      const node = state.entities[id]

      const weekNodes = state.ids.filter(
        (nodeId) =>
          nodeId !== node.id && state.entities[nodeId].week === node.week
      )

      const collapseRow = getCollapsedWeekRow({
        ids: weekNodes,
        entities: state.entities,
        from: { week: node.week, row: node.order },
        to: { week: node.week, row: node.order }
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
        newRow = edge === 'bottom' ? toRow + 1 : toRow
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
        from: { week: fromWeek, row: oldRow },
        to: { week: toWeek, row: newRow },
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

      if (insertModeRow && collapseRow === null) {
        gridSplits.after.forEach((nodeId) => {
          state.entities[nodeId].order += 1
        })
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
        outcomeid: string
        nodeid: string
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
     * STRATEGY
     *******************************************************/
    builder
      .addCase(
        StrategyActions.ADD_STRATEGY as string,
        (state, action: PayloadAction<{ nodesAdded: TNode[] }>) => {
          // TODO: review
          // return state.concat(action.payload.nodesAdded)
        }
      )
      /*******************************************************
       * OUTCOME
       *******************************************************/
      .addCase(OutcomeActions.DELETE_SELF as string, updateItem)
      .addCase(OutcomeBaseActions.DELETE_SELF as string, updateItem)

      .addCase(OutcomeActions.INSERT_CHILD as string, updatingNodeSet)
      .addCase(OutcomeActions.INSERT_BELOW as string, updatingNodeSet)
      .addCase(OutcomeBaseActions.INSERT_CHILD as string, updatingNodeSet)
      .addCase(OutcomeOutcomeActions.CHANGE_ID as string, updatingNodeSet)

      /*******************************************************
       * COLUMN
       *******************************************************/
      .addCase(
        ColumnActions.DELETE_SELF as string,
        (state, action: PayloadAction<DeleteColumnAction>) => {
          state.ids.forEach((nodeId) => {
            const node = state.entities[nodeId]
            // TODO: mmmm, should we delete nodes if associated column is deleted?
            if (node.column === action.payload.id) {
              node.deleted = true
              node.column = -1
            }
          })
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
