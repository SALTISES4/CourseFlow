import { CfLock } from '@cf/types/common'
import { _t } from '@cf/utility/Utility.class'
import {
  CommonActions,
  NodeLinkActions,
  SliceNamespace,
  StrategyActions,
  WeekActions
} from '@cfRedux/types/enumActions'
import { AppState, TColumn, TNodelink } from '@cfRedux/types/type'
import { PayloadAction, createSlice } from '@reduxjs/toolkit'

interface CreateLockPayload {
  id: number
  lock: CfLock
}

interface ChangeFieldPayload {
  id: number
  json: Pick<TNodelink>
}

interface NodeLinkByIdPayload {
  id: number
}

interface InsertBelowWeekPayload {
  children?: { nodelink: TNodelink[] }
}

interface AddStrategyPayload {
  nodelinksAdded: TNodelink[]
}

interface ReplaceStoreDataPayload {
  nodelink?: TNodelink[]
}

const initialState: TNodelink[] = []

const nodelinkSlice = createSlice<AppState['nodelink']>({
  name: SliceNamespace.NODELINK,
  initialState,
  reducers: {
    createLock(state, action: PayloadAction<CreateLockPayload>) {
      const item = state.find((item) => item.id === action.payload.id)
      if (item) {
        item.lock = action.payload.lock
      }
    },
    changeField(state, action: PayloadAction<ChangeFieldPayload>) {
      const item = state.find((item) => item.id === action.payload.id)
      if (item) {
        Object.assign(item, action.payload.json)
      }
    },
    newNodeLink(state, action: PayloadAction<TNodelink>) {
      state.push(action.payload)
    },
    deleteSelf(state, action: PayloadAction<NodeLinkByIdPayload>) {
      // maybe use findIndex and splice
      return state.filter((item) => item.id !== action.payload.id)
    },
    deleteSelfSoft(state, action: PayloadAction<NodeLinkByIdPayload>) {
      const item = state.find((item) => item.id === action.payload.id)
      if (item) {
        item.deleted = true
        item.deletedOn = _t('This session')
      }
    },
    restoreSelf(state, action: PayloadAction<NodeLinkByIdPayload>) {
      const item = state.find((item) => item.id === action.payload.id)
      if (item) {
        item.deleted = false
      }
    }
  },
  extraReducers: (builder) => {
    /*******************************************************
     * COMMON
     *******************************************************/
    builder
      .addCase(
        CommonActions.REPLACE_STOREDATA,
        (state, action: PayloadAction<{ nodelink?: TNodelink[] }>) => {
          if (action.payload.nodelink) {
            return action.payload.nodelink
          }
        }
      )
      .addCase(
        CommonActions.REFRESH_STOREDATA,
        (state, action: PayloadAction<{ nodelink?: TNodelink[] }>) => {
          if (action.payload.nodelink) {
            action.payload.nodelink.forEach((newNodelink) => {
              const index = state.findIndex(
                (item) => item.id === newNodelink.id
              )
              if (index !== -1) {
                state[index] = newNodelink
              } else {
                state.push(newNodelink)
              }
            })
          }
        }
      )
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
  }
})

export const {
  replaceStoreData: nodelinkReplaceStoreData,
  refreshStoreData: nodelinkRefreshStoreData,
  createLock: nodelinkCreateLock,
  changeField: nodelinkChangeField,
  newNodeLink: nodelinkNewNodeLink,
  deleteSelf: nodelinkDeleteSelf,
  deleteSelfSoft: nodelinkDeleteSelfSoft,
  restoreSelf: nodelinkRestoreSelf,
  insertBelow: nodelinkInsertBelow,
  addStrategy: nodelinkAddStrategy
} = nodelinkSlice.actions

export default nodelinkSlice.reducer
