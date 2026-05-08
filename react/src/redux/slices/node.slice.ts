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

interface DeleteColumnAction {
  uuid: string
  extraData: any
}

export type NodeWorkflowReorderPayload = {
  mode?: 'row' | 'column'
  edge?: 'top' | 'bottom'
  uuid: string
  fromSection: number
  toSection: number
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
  action: PayloadAction<{ uuid: string; data: Partial<TNode> }>
) => {
  nodeAdapter.updateOne(state, {
    uuid: action.payload.uuid,
    changes: action.payload.data
  })
}

const removeEntityById = (
  state: NodeState,
  action: PayloadAction<{ uuid: string }>
) => {
  nodeAdapter.removeOne(state, action.payload.uuid)
}

const toggleArchiveEntity = (
  state: NodeState,
  action: PayloadAction<{ uuid: string }>
) => {
  const entity = state.entities[action.payload.uuid]
  if (entity) {
    nodeAdapter.updateOne(state, {
      uuid: action.payload.uuid,
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
      uuid: string
      outcomenodeSet: any[]
      outcomenodeUniqueSet: any[]
    }[]
  }>
) => {
  if (action.payload.nodeUpdates.length === 0) {
    return
  }

  const updates = action.payload.nodeUpdates.map((update) => ({
    uuid: update.uuid,
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
  ids: string[]
  entities: typeof initialState.entities
  column?: string
  newRow: number
}) => {
  const before: string[] = []
  const after: string[] = []

  ids.forEach((nodeId) => {
    const n = entities[nodeId]
    if (n.deleted) {
      return
    }

    const columnMatch =
      column !== undefined ? n.column.toString() === column : true

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
const getCollapsedSectionRow = ({
  ids,
  entities,
  from,
  to,
  columnMode
}: {
  ids: string[]
  entities: typeof initialState.entities
  from: { section: string; row: number }
  to: { section: string; row: number }
  columnMode?: boolean
}): number | null => {
  const sameRow = ids.filter((nodeId) => {
    const n = entities[nodeId]
    return n.deleted === false && n.order === from.row
  })
  const columnCheck = columnMode
    ? from.section !== to.section ||
      (from.section === to.section && from.row !== to.row)
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
      (updateItem) => updateItem.uuid === item.uuid
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
      action: PayloadAction<{ uuid: string; commentData: any }>
    ) {
      nodeAdapter.updateOne(state, {
        uuid: action.payload.uuid,
        changes: { comments: action.payload.commentData }
      })
    },

    setLinkedWorkflow(
      state,
      action: PayloadAction<{
        nodeId: string
        workflowId: string
        workflowData: ELibraryObject
        representsWorkflow?: boolean
      }>
    ) {
      const { nodeId, workflowId, workflowData, representsWorkflow } =
        action.payload

      // TODO: refactor ID being a string
      console.log('TOOD: setLinkedWorkflow', action.payload)
      // nodeAdapter.updateOne(state, {
      //   uuid: nodeId,
      //   changes: {
      //     linkedWorkflow: workflowId,
      //     linkedWorkflowData: workflowData,
      //     ...(representsWorkflow !== undefined && {
      //       representsWorkflow
      //     })
      //   }
      // })
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
            nodeId: string
            mode: NodeWorkflowReorderPayload['mode']
            duplicate?: boolean
          }
        | {
            newColumn?: boolean
            columnId: string
            sectionId: string
            mode: NodeWorkflowReorderPayload['mode']
            row: number
          }
      >
    ) => {
      console.log('TODO: review workflowNodeInsert', action.payload)
      return state

      if ('columnId' in action.payload) {
        const { newColumn, mode, columnId, sectionId, row } = action.payload
        const sectionNodes = state.uuids.filter(
          (nodeId) => state.entities[nodeId].section.toString() === sectionId
        )

        const gridSplits = splitWorkflowGridNodes({
          ids: sectionNodes,
          entities: state.entities,
          newRow: row,
          column: mode === 'row' ? undefined : newColumn ? '-1' : columnId
        })

        // grab any existing node
        const clone = state.entities[state.uuids[0]]
        nodeAdapter.addOne(state, {
          ...clone,
          // TODO: not gonna quite work, review
          // uuid: getNextLargestNumber(state.uuids),
          title: _t('Blank title'),
          order: row,
          section: sectionId,
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

        const sectionNodes = state.uuids.filter(
          (nodeId) =>
            nodeId !== node.uuid &&
            state.entities[nodeId].section === node.section
        )

        const gridSplits = splitWorkflowGridNodes({
          ids: sectionNodes,
          entities: state.entities,
          newRow: node.order + 1,
          column: mode === 'column' ? node.column.toString() : undefined
        })

        const clone = { ...node }
        nodeAdapter.addOne(state, {
          ...clone,
          // uuid: getNextLargestNumber(state.uuids),
          uuid: 'hello-there',
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

    workflowNodeDelete: (state, action: PayloadAction<{ uuid: string }>) => {
      const { id } = action.payload
      const node = state.entities[id]

      const sectionNodes = state.uuids.filter(
        (nodeId) =>
          nodeId !== node.uuid &&
          state.entities[nodeId].section === node.section
      )

      const collapseRow = getCollapsedSectionRow({
        ids: sectionNodes,
        entities: state.entities,
        from: { section: node.section.toString(), row: node.order },
        to: { section: node.section.toString(), row: node.order }
      })

      nodeAdapter.removeOne(state, action.payload.uuid)

      if (collapseRow !== null) {
        splitWorkflowGridNodes({
          ids: sectionNodes,
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
      const { mode, edge, id, fromSection, toSection, toColumn, toRow } =
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

      const fromSectionNodes = state.uuids.filter(
        (nodeId) =>
          nodeId !== id && state.entities[nodeId].section === fromSection
      )

      const toSectionNodes =
        fromSection === toSection
          ? fromSectionNodes
          : state.uuids.filter(
              (nodeId) =>
                nodeId !== id && state.entities[nodeId].section === toSection
            )

      const gridSplits = splitWorkflowGridNodes({
        ids: toSectionNodes,
        entities: state.entities,
        newRow,
        column: insertModeColumn ? toColumn.toString() : undefined
      })

      const collapseRow = getCollapsedSectionRow({
        ids: fromSectionNodes,
        entities: state.entities,
        from: { section: fromSection.toString(), row: oldRow },
        to: { section: toSection.toString(), row: newRow },
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
        // ... but only if it happened in the same section
        newRow =
          fromSection === toSection && newRow > oldRow ? newRow - 1 : newRow

        // collapse the source section rows to account for the collapse
        fromSectionNodes.forEach((nodeId) => {
          const n = state.entities[nodeId]
          if (n.order > collapseRow) {
            n.order -= 1
          }
        })

        // and finally bump up the "after" rows for the destination section
        gridSplits.after.forEach((nodeId) => {
          state.entities[nodeId].order += 1
        })
      }

      movedNode.order = newRow
      movedNode.column = toColumn
      movedNode.section = toSection
    },

    // add/remove linked outcomes
    workfowLinkOutcome: (
      state,
      action: PayloadAction<{
        outcomeId: string
        nodeId: string
      }>
    ) => {
      const { outcomeId, nodeId } = action.payload
      const node = state.entities[nodeId]

      if (!node) {
        return
      }

      // TODO: mixing string/number for the ID field won't cut it, review
      console.log('TODO: workfowLinkOutcome', action.payload)

      // if (!node.outcomenodeSet) {
      //   node.outcomenodeSet = [outcomeId]
      // } else {
      //   const index = node.outcomenodeSet?.indexOf(outcomeId)
      //   if (index !== -1) {
      //     node.outcomenodeSet.splice(index, 1)
      //   } else {
      //     node.outcomenodeSet.push(outcomeId)
      //   }
      // }
    },

    // this one had a jquery update side effect
    //  ThemeHelper.triggerHandlerEach($('.section .node'), 'component-updated')
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
          state.uuids.forEach((nodeId) => {
            const node = state.entities[nodeId]
            // TODO: mmmm, should we delete nodes if associated column is deleted?
            if (node.column.toString() === action.payload.uuid) {
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
