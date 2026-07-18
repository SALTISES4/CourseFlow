import type { GraphState } from '../graphState'
import type { ResourceUuid } from '../model/types'

type StateWithGraph = {
  graph: GraphState
}

export const selectThreadCommentCount = (
  state: StateWithGraph,
  threadUuid: ResourceUuid | null | undefined
): number =>
  threadUuid ? (state.graph.threadCommentCounts[threadUuid] ?? 0) : 0
