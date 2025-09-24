import { selectNodeById } from '@cfRedux/selectors/node.selector'
import { RootState } from '@cfRedux/store'
import { AppState } from '@cfRedux/types/type'
import { createSelector } from 'reselect'

const selectNodeState = (state: AppState) => state.workspace.node
const selectNodeWeekState = (state: AppState) => state.nodeweek
const selectNodeWeekId = (_: AppState, id: number) => id

/**
 * Memoized selector to find a node week by ID.
 */
export const getNodeWeekById = createSelector(
  [
    selectNodeWeekState,
    selectNodeWeekId,
    selectNodeState,
    (state: RootState) => state
  ],
  (nodeweeks, id, nodes, state) => {
    const nodeweek = nodeweeks.find((nw) => nw.id === id)

    if (nodeweek) {
      const node = selectNodeById(state, nodeweek.node)
      return {
        data: nodeweek,
        order: node?.order ?? [],
        column: node?.column ?? null
      }
    }

    return null
  }
)
