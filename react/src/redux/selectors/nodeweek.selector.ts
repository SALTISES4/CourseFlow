import { getNodeById } from '@cfRedux/selectors/node.selector'
import { AppState } from '@cfRedux/types/type'
import { createSelector } from 'reselect'

const selectNodeState = (state: AppState) => state.node
const selectNodeWeekState = (state: AppState) => state.nodeweek
const selectNodeWeekId = (_: AppState, id: number) => id
const selectWeekState = (state: AppState) => state.week

/**
 * Memoized selector to find a node week by ID.
 */
export const getNodeWeekById = createSelector(
  [
    selectNodeWeekState,
    selectNodeWeekId,
    selectNodeState,
    (state: AppState) => state
  ],
  (nodeweeks, id, nodes, state) => {
    const nodeweek = nodeweeks.find((nw) => nw.id === id)

    if (nodeweek) {
      const node = getNodeById(state, nodeweek.node)?.data
      return {
        data: nodeweek,
        order: node?.order ?? [],
        column: node?.column ?? null
      }
    }

    return null
  }
)
