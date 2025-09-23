import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import ActionCreator from '@cfRedux/ActionCreator'
import { sidebarEdit } from '@cfRedux/slices/sidebar.slice'
import store from '@cfRedux/store'
import { AnyAction } from '@reduxjs/toolkit'
import { Dispatch } from 'redux'

// thin wrapper around dipachtchers
// this started as the successor to selection manager
// but the use case is really to as a proxy to move redux dispatcher helpers
// out of the 'editable component' inheritance chain
//
// this class has no state (not a react class)
// dispatch is passed as props
// It has no access to context
// we can decide if it needs to take on more responsibility later but
// most likely it will be replaced by hooks and composition

class BetterSelectionManager {
  dispatch: Dispatch<AnyAction>

  constructor(dispatch: Dispatch<AnyAction>) {
    this.dispatch = dispatch
  }

  updateSidebar(id: number, objectType: CfObjectType, parentId?: number) {
    store.dispatch(sidebarEdit({ id, parentId, objectType }))
  }

  clearSidebar() {
    store.dispatch(sidebarEdit({}))
  }

  toggleDropReduxAction({
    objectId,
    objectType,
    newDropState,
    depth = 1
  }: {
    objectId: number
    objectType: CfObjectType
    newDropState: boolean
    depth?: number
  }) {
    // maybe logic to sync to local storage
    // but if so we should compose a manager, and sync it with a derived state in redux

    this.dispatch(
      ActionCreator.changeField(objectId, objectType, {
        isDropped: newDropState
      })
    )
  }
}

export default BetterSelectionManager
