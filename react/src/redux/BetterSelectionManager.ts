import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import ActionCreator from '@cfRedux/ActionCreator'
import { SidebarEdit } from '@cfRedux/reducers/sidebar/actions'
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
    store.dispatch(SidebarEdit({ id, parentId, objectType }))
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
    try {
      const defaultDrop = Constants.getDefaultDropState(
        objectId,
        objectType,
        depth
      )
      if (newDropState !== defaultDrop) {
        window.localStorage.setItem(objectType + objectId, String(newDropState))
      } else {
        window.localStorage.removeItem(objectType + objectId)
      }
    } catch (err) {
      const error = err as Error

      // this suggests an abuse of local storage
      // to investigate at some point
      if (
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED' // lol
      ) {
        window.localStorage.clear()
      }
    }

    this.dispatch(
      ActionCreator.changeField(objectId, objectType, {
        isDropped: newDropState
      })
    )
  }
}

export default BetterSelectionManager
