import { RootState } from '@cf/redux/store'
import { createSelector } from '@reduxjs/toolkit'

import {
  selectChannelsOrderedByGraphUuid,
  selectSectionsOrderedByGraphUuid
} from './canonical.selectors'
import { GraphBoard, selectGraphBoard } from './graphBoard.selectors'
import {
  selectOutcomeEntities,
  selectOutcomeTagGroups,
  selectOutcomeTagGroupsTree
} from './outcomes.selectors'
import { ChannelEntity, SectionEntity } from '../model/types'

export type OutcomeTable = {
  tagGroups: ReturnType<typeof selectOutcomeTagGroups>
  board: GraphBoard

  // entities
  outcomes: ReturnType<typeof selectOutcomeEntities>
  outcomeTree: ReturnType<typeof selectOutcomeTagGroupsTree>
  sections: SectionEntity[]
  channels: ChannelEntity[]
}

export const selectOutcomeTable = createSelector(
  [
    (state: RootState, graphUuid: string) => selectGraphBoard(state, graphUuid),
    (state: RootState, graphUuid: string) =>
      selectOutcomeTagGroups(state, graphUuid),
    (state: RootState, graphUuid: string) =>
      selectOutcomeTagGroupsTree(state, graphUuid),
    (state: RootState) => selectOutcomeEntities(state),
    (state: RootState, graphUuid: string) =>
      selectSectionsOrderedByGraphUuid(graphUuid)(state),
    (state: RootState, graphUuid: string) =>
      selectChannelsOrderedByGraphUuid(graphUuid)(state)
  ],
  (
    graphBoard,
    outcomeGroups,
    outcomeTree,
    outcomes,
    sections,
    channels
  ): OutcomeTable => ({
    tagGroups: outcomeGroups,
    board: graphBoard,
    outcomes,
    outcomeTree,
    channels,
    sections
  })
)
