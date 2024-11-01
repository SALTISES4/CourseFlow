import { CfObjectType } from '@cf/types/enum'
import ActionCreator from '@cfRedux/ActionCreator'
import { SetSidebarAction } from '@cfRedux/reducers/sidebar'
import { Dispatch } from 'redux'

// thin wrapper around ActionCreator.sidebarUpdate
// this class may be redundant / pointless
// but we will use it transition away from
// editable components
// this class has no state (not a react class)
// dispatch is passed as props
// has no access to context
// we can decide if it needs to take on more responsibility later but

class BetterSelectionManager {
  dispatch: Dispatch<SetSidebarAction>

  constructor(dispatch: Dispatch<SetSidebarAction>) {
    this.dispatch = dispatch
  }

  updateSidebar(id: number, objectType: CfObjectType, parentId?: number) {
    const action = ActionCreator.sidebarUpdate(id, objectType, parentId)
    this.dispatch(action)
  }
}

export default BetterSelectionManager
