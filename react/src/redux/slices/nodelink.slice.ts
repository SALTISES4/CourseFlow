import { CfLock } from '@cf/types/common'
import { _t } from '@cf/utility/Utility.class'
import {
  CommonActions,
  SliceNamespace,
  StrategyActions,
  WeekActions
} from '@cfRedux/types/enumActions'
import { TNodelink, WorkspaceAppState } from '@cfRedux/types/type'
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
export const replaceStoreData = createAction<{
  nodelink: WorkspaceAppState['nodelink'] | undefined
}>(CommonActions.REPLACE_STOREDATA)

export const refreshStoreData = createAction<{
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
    },
    deleteSelfSoft(state, action: PayloadAction<NodelinkByIdPayload>) {
      nodelinkAdapter.updateOne(state, {
        id: action.payload.id,
        changes: {
          deleted: true,
          deletedOn: _t('This session')
        }
      })
    },
    restoreSelf(state, action: PayloadAction<NodelinkByIdPayload>) {
      nodelinkAdapter.updateOne(state, {
        id: action.payload.id,
        changes: { deleted: false }
      })
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
        WeekActions.INSERT_BELOW,
        (
          state,
          action: PayloadAction<{ children?: { nodelink: TNodelink[] } }>
        ) => {
          if (action.payload.children) {
            return [...state, ...action.payload.children.nodelink]
          }
        }
      )
      .addCase(
        StrategyActions.ADD_STRATEGY,
        (state, action: PayloadAction<{ nodelinksAdded: TNodelink[] }>) => {
          if (action.payload.nodelinksAdded.length !== 0) {
            return [...state, ...action.payload.nodelinksAdded]
          }
        }
      )
      .addCase(svglinkDragEnd, (state, action) => {
        const { id, from, to } = action.payload
        if (id === null) {
          console.log('creating new nodelink', from, to)
        }

        if (id && from.nodeId && to.nodeId) {
          console.log('---- nodelink', id, 'changed')
          console.log(from, to)
        }
      })
  }
})

export const {
  createLock: nodelinkCreateLock,
  changeField: nodelinkChangeField,
  newNodelink: nodelinkNewNodelink,
  deleteSelf: nodelinkDeleteSelf,
  deleteSelfSoft: nodelinkDeleteSelfSoft,
  restoreSelf: nodelinkRestoreSelf
  //  insertBelow: nodelinkInsertBelow,
  //  addStrategy: nodelinkAddStrategy
} = nodelinkSlice.actions

export default nodelinkSlice.reducer
