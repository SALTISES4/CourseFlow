import { CfLock } from '@cf/types/common'
import { _t } from '@cf/utility/Utility.class'
import { weekAdapter } from '@cfRedux/slices/week.slice'
import {
  CommonActions,
  NodelinkActions,
  SliceNamespace,
  StrategyActions,
  WeekActions
} from '@cfRedux/types/enumActions'
import {
  AppState,
  TColumn,
  TNodelink,
  TWeek,
  WorkspaceAppState
} from '@cfRedux/types/type'
import {
  PayloadAction,
  createAction,
  createEntityAdapter,
  createSlice
} from '@reduxjs/toolkit'

interface CreateLockPayload {
  id: number
  lock: CfLock
}

interface ChangeFieldPayload {
  id: number
  json: Pick<TNodelink>
}

interface NodelinkByIdPayload {
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
    newNodelink(state, action: PayloadAction<TNodelink>) {
      state.push(action.payload)
    },
    deleteSelf(state, action: PayloadAction<NodelinkByIdPayload>) {
      // maybe use findIndex and splice
      return state.filter((item) => item.id !== action.payload.id)
    },
    deleteSelfSoft(state, action: PayloadAction<NodelinkByIdPayload>) {
      const item = state.find((item) => item.id === action.payload.id)
      if (item) {
        item.deleted = true
        item.deletedOn = _t('This session')
      }
    },
    restoreSelf(state, action: PayloadAction<NodelinkByIdPayload>) {
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
      .addCase(replaceStoreData, (state, action) => {
        if (action.payload.nodelink) {
          return action.payload.nodelink
        }
      })
      .addCase(refreshStoreData, (state, action) => {
        if (action.payload.nodelink) {
          nodelinkAdapter.upsertMany(state, action.payload.week)
        }
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
