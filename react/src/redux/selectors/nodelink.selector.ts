import Utility from '@cf/utility/Utility.class'
import { AppState } from '@cfRedux/types/type'
import { createSelector } from 'reselect'

const selectId = (_, id: number) => id
const getAllNodeLinks = (state: AppState) => state.workspace.nodelink

export const selectNodeLinkById = createSelector(
  [selectId, getAllNodeLinks],
  (id, nodelinks) => {
    const nodelink = nodelinks.find((nl) => nl.id === id)
    if (nodelink) {
      return nodelink
    }
    Utility.logger('no nodelink found with id', id)
    return
  }
)
