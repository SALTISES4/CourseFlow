import { CfLock } from '@cf/types/common'
import { _t } from '@cf/utility/Utility.class'
import {
  CommonActions,
  SliceNamespace,
  StrategyActions,
  WeekActions
} from '@cfRedux/types/enumActions'
import { TNodelink, WorkspaceAppState } from '@cfRedux/types/type'
import { getEdgePortKey } from '@cfViews/WorkflowView/WorkflowEditView/components/LineSVG/types'
import {
  PayloadAction,
  createAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

import { svglinkDragEnd } from './svglink.slice'

interface CreateLockPayload {
  id: number
  lock: CfLock
}

interface ChangeFieldPayload {
  id: number
  json: Partial<TNodelink>
}

interface NodelinkByIdPayload {
  id: number
}

export const nodelinkAdapter = createEntityAdapter<TNodelink>()
const initialState = nodelinkAdapter.getInitialState()

/*******************************************************
 * CREATE ACTIONS
 *******************************************************/
const replaceStoreData = createAction<{
  nodelink: WorkspaceAppState['nodelink'] | undefined
}>(CommonActions.REPLACE_STOREDATA)

const refreshStoreData = createAction<{
  nodelink: WorkspaceAppState['nodelink'] | undefined
}>(CommonActions.REFRESH_STOREDATA)

/*******************************************************
 * SLICE
 *******************************************************/
const nodelinkSlice = createSlice({
  name: SliceNamespace.NODELINK,
  initialState,
  reducers: {
    changeField(state, action: PayloadAction<ChangeFieldPayload>) {
      nodelinkAdapter.updateOne(state, {
        id: action.payload.id,
        changes: action.payload.json
      })
    },
    createLock(state, action: PayloadAction<CreateLockPayload>) {
      nodelinkAdapter.updateOne(state, {
        id: action.payload.id,
        changes: { lock: action.payload.lock }
      })
    },
    newNodelink(state, action: PayloadAction<TNodelink>) {
      nodelinkAdapter.addOne(state, action.payload)
    },
    deleteSelf(state, action: PayloadAction<NodelinkByIdPayload>) {
      nodelinkAdapter.removeOne(state, action.payload.id)
    }
  },
  extraReducers: (builder) => {
    /*******************************************************
     * COMMON
     *******************************************************/
    builder
      .addCase(replaceStoreData, (state, action) => {
        if (action.payload.nodelink) {
          nodelinkAdapter.setAll(state, action.payload.nodelink)
        } else {
          nodelinkAdapter.removeAll(state)
        }
      })
      .addCase(refreshStoreData, (state, action) => {
        nodelinkAdapter.upsertMany(state, action.payload.nodelink)
      })
      .addCase(
        WeekActions.INSERT_BELOW as string,
        (
          state,
          action: PayloadAction<{ children?: { nodelink: TNodelink[] } }>
        ) => {
          // TODO: review / delete
          // if (action.payload.children) {
          //   return [...state, ...action.payload.children.nodelink]
          // }
        }
      )
      .addCase(
        StrategyActions.ADD_STRATEGY as string,
        (state, action: PayloadAction<{ nodelinksAdded: TNodelink[] }>) => {
          // TODO: review / delete
          // if (action.payload.nodelinksAdded.length !== 0) {
          //   return [...state, ...action.payload.nodelinksAdded]
          // }
        }
      )
      .addCase(svglinkDragEnd, (state, action) => {
        const { id, from, to } = action.payload
        if (!from || !to) {
          return
        }

        if (id === null) {
          // TODO: actually figure out how we'll be handling this
          const newLink = { ...state.entities[state.ids[state.ids.length - 1]] }

          // figure out the next biggest id
          newLink.id = state.ids.reduce((acc, c) => Math.max(acc, c), 0) + 1
          newLink.sourceNode = from.nodeId
          newLink.sourcePort = getEdgePortKey(from.edge)
          newLink.targetNode = to.nodeId
          newLink.targetPort = getEdgePortKey(to.edge)

          // only allow one unique connection combo sourceId/sourceEdge -> targetId/targetEdge
          const found = state.ids.filter((id) => {
            const nodelink = state.entities[id]
            return (
              nodelink.sourceNode === newLink.sourceNode &&
              nodelink.sourcePort === newLink.sourcePort &&
              nodelink.targetNode === newLink.targetNode &&
              nodelink.targetPort === newLink.targetPort
            )
          })

          // if not found, create new link
          if (!found.length) {
            nodelinkAdapter.addOne(state, newLink)
          } else {
            // if a link already exists, but it's been deleted, just restore it
            const link = state.entities[found[0]]
            if (link.deleted) {
              link.deleted = false
            }
          }
        } else {
          const target = state.entities[id]
          target.sourceNode = from.nodeId
          target.sourcePort = getEdgePortKey(from.edge)
          target.targetNode = to.nodeId
          target.targetPort = getEdgePortKey(to.edge)
        }
      })
  }
})

export const {
  createLock: nodelinkCreateLock,
  changeField: nodelinkChangeField,
  newNodelink: nodelinkNewNodelink,
  deleteSelf: nodelinkDeleteSelf
  //  addStrategy: nodelinkAddStrategy
} = nodelinkSlice.actions

export default nodelinkSlice.reducer
