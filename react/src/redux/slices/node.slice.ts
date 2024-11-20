import { CfLock } from '@cf/types/common'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { _t } from '@cf/utility/Utility.class'
import {
  ColumnActions,
  CommonActions,
  NodeActions,
  NodeLinkActions,
  OutcomeActions,
  OutcomeBaseActions,
  OutcomeNodeActions,
  OutcomeOutcomeActions,
  SliceNamespace,
  StrategyActions,
  WeekActions
} from '@cfRedux/types/enumActions'
import { AppState, TNode } from '@cfRedux/types/type'
import { AnyAction, PayloadAction, createSlice } from '@reduxjs/toolkit'

interface DeleteColumnAction {
  id: number
  extraData: any
}

const initialState: TNode[] = []

/*******************************************************
 * Reusable Reducer Functions
 *******************************************************/
const updateEntity = <T, S>(
  state: T,
  action: PayloadAction<{
    id: number
    data: Pick<S>
  }>
) => {
  return state.map((item) =>
    item.id === action.payload.id ? { ...item, ...action.payload.data } : item
  )
}

const removeEntityById = (
  state: AppState['node'],
  action: PayloadAction<{ id: number }>
) => {
  return state.filter((item) => item.id !== action.payload.id)
}

const toggleArchiveEntity = (
  state: AppState['node'],
  action: PayloadAction<{ id: number }>
) => {
  return state.map((item) => {
    if (item.id === action.payload.id) {
      return {
        ...item,
        deleted: !item.deleted,
        deletedOn: item.deleted ? undefined : _t('This session')
      }
    }
    return item
  })
}

const deleteOutgoingLinks = (
  state: AppState['node'],
  action: PayloadAction<{ id: number }>
) => {
  return state.map((item) => {
    if (item.outgoingLinks.includes(action.payload.id)) {
      return {
        ...item,
        outgoingLinks: item.outgoingLinks.filter(
          (linkId) => linkId !== action.payload.id
        )
      }
    }
    return item
  })
}

const updatingNodeSet = (
  state: AppState['node'],
  action: PayloadAction<any>
) => {
  if (action.payload.nodeUpdates.length === 0) {
    return state
  }

  return state.map((item) => {
    const update = action.payload.nodeUpdates.find(
      (updateItem) => updateItem.id === item.id
    )
    return update
      ? {
          ...item,
          outcomenodeSet: update.outcomenodeSet,
          outcomenodeUniqueSet: update.outcomenodeUniqueSet
        }
      : item
  })
}

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
 * Node Slice
 *******************************************************/
const nodeSlice = createSlice<AppState['node']>({
  name: SliceNamespace.NODE,
  initialState,
  reducers: {
    changedColumn(
      state,
      action: PayloadAction<{ id: number; newColumn: number }>
    ) {
      state = state.map((item) => {
        if (item.id === action.payload.id) {
          return { ...item, column: action.payload.newColumn }
        }
        return item
      })
    },
    createLock: updateEntity<AppState['node'], TNode>,
    changeField: updateEntity<AppState['node'], TNode>,
    deleteSelf: removeEntityById,
    deleteSelfSoft: toggleArchiveEntity,
    insertBelow(state, action: PayloadAction<{ newModel: TNode }>) {
      state.push(action.payload.newModel)
    },
    reloadComments(
      state,
      action: PayloadAction<{ id: number; commentData: any }>
    ) {
      return state.map((item) => {
        if (item.id === action.payload.id) {
          return { ...item, comments: action.payload.commentData }
        }
        return item
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
      return state.map((item) => {
        if (item.id === action.payload.id) {
          return {
            ...item,
            linkedWorkflow: action.payload.linkedWorkflow,
            linkedWorkflowData: action.payload.linkedWorkflowData
          }
        }
        return item
      })
    },

    // this one had a jquery update side effect
    //  ThemeHelper.triggerHandlerEach($('.week .node'), 'component-updated')
    restoreSelf: toggleArchiveEntity,
    newNode(state, action: PayloadAction<{ newModel: TNode }>) {
      state.push(action.payload.newModel)
    }
  },
  extraReducers: (builder) => {
    /*******************************************************
     * COMMON
     *******************************************************/
    builder
      .addCase(
        CommonActions.REPLACE_STOREDATA,
        (state, action: PayloadAction<{ node?: TNode[] }>) => {
          return action.payload.node || state
        }
      )
      .addCase(
        CommonActions.REFRESH_STOREDATA,
        (state, action: PayloadAction<{ node?: TNode[] }>) => {
          const updatedState = [...state]
          if (action.payload.node) {
            action.payload.node.forEach((nodeItem) => {
              const existingIndex = updatedState.findIndex(
                (item) => item.id === nodeItem.id
              )
              if (existingIndex >= 0) {
                updatedState[existingIndex] = nodeItem
              } else {
                updatedState.push(nodeItem)
              }
            })
          }
          return updatedState
        }
      )
    /*******************************************************
     * NODE LINK
     *******************************************************/
    builder
      .addCase(
        NodeLinkActions.RESTORE_SELF,
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
        NodeLinkActions.NEW_NODE_LINK,
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
      .addCase(NodeLinkActions.DELETE_SELF_SOFT, deleteOutgoingLinks)
      .addCase(NodeLinkActions.DELETE_SELF, deleteOutgoingLinks)

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
  changedColumn: nodeChangedColumn,
  createLock: nodeCreateLock,
  changeField: nodeChangeField,
  deleteSelf: nodeDeleteSelf,
  deleteSelfSoft: nodeDeleteSelfSoft,
  restoreSelf: nodeRestoreSelf,
  insertBelow: nodeInsertBelow,
  reloadComments: nodeReloadComments,
  setLinkedWorkflow: nodeSetLinkedWorkflow
} = nodeSlice.actions

export default nodeSlice.reducer
