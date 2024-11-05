import { CfObjectType } from '@cf/types/enum'
import { SET_EDIT } from '@cfRedux/reducers/sidebar/actions'
import store from '@cfRedux/store'

// thin wrapper around ActionCreator.sidebarUpdate
// this class may be redundant / pointless
// but we will use it transition away from
// editable components
// this class has no state (not a react class)
// dispatch is passed as props
// has no access to context
// we can decide if it needs to take on more responsibility later but

class BetterSelectionManager {
  updateSidebar(id: number, objectType: CfObjectType, parentId?: number) {
    store.dispatch(SET_EDIT({ id, objectType, parentId }))
  }
}

export default BetterSelectionManager
