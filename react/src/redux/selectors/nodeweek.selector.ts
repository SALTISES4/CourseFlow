import { selectNodeById } from '@cfRedux/selectors/node.selector'
import { RootState } from '@cfRedux/store'
import { AppState } from '@cfRedux/types/type'
import { createSelector } from 'reselect'

const selectNodeState = (state: AppState) => state.workspace.node
const selectNodeSectionState = (state: AppState) => state.nodesection
const selectNodeSectionId = (_: AppState, uuid: string) => id

/**
 * Memoized selector to find a node section by ID.
 */
export const getNodeSectionById = createSelector(
  [
    selectNodeSectionState,
    selectNodeSectionId,
    selectNodeState,
    (state: RootState) => state
  ],
  (nodesections, id, nodes, state) => {
    const nodesection = nodesections.find((nw) => nw.uuid === id)

    if (nodesection) {
      const node = selectNodeById(state, nodesection.node)
      return {
        data: nodesection,
        order: node?.order ?? [],
        column: node?.column ?? null
      }
    }

    return null
  }
)
