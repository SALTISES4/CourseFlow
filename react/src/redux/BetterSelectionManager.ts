import { CfObjectType } from '@cf/types/enum'
import { sidebarEdit } from '@cfRedux/slices/sidebar.slice'
import store from '@cfRedux/store'
import { UnknownAction } from '@reduxjs/toolkit'
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
  dispatch: Dispatch<UnknownAction>

  constructor(dispatch: Dispatch<UnknownAction>) {
    this.dispatch = dispatch
  }

  updateSidebar(uuid: string, objectType: CfObjectType, parentId?: string) {
    store.dispatch(sidebarEdit({ id, parentId, objectType }))
  }

  clearSidebar() {
    store.dispatch(sidebarEdit({}))
  }
}

export default BetterSelectionManager
