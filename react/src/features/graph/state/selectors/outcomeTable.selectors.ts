import { RootState } from '@cf/redux/store'
import { createSelector } from '@reduxjs/toolkit'

import {
  selectAllTags,
  selectChannelsOrderedByGraphUuid,
  selectSectionsOrderedByGraphUuid
} from './canonical.selectors'
import { GraphBoard, selectGraphBoard } from './graphBoard.selectors'
import {
  selectOutcomeEntities,
  selectOutcomeTagGroups
} from './outcomes.selectors'
import { ChannelEntity, OutcomeEntity, SectionEntity } from '../model/types'

export type OutcomeTable = {
  tagGroups: ReturnType<typeof selectOutcomeTagGroups>
  board: GraphBoard

  // entities
  outcomes: ReturnType<typeof selectOutcomeEntities>
  sections: SectionEntity[]
  channels: ChannelEntity[]
}

export const selectOutcomeTable = createSelector(
  [
    (state: RootState, graphUuid: string) => selectGraphBoard(state, graphUuid),
    (state: RootState, graphUuid: string) =>
      selectOutcomeTagGroups(state, graphUuid),
    (state: RootState) => selectOutcomeEntities(state),
    (state: RootState, graphUuid: string) =>
      selectSectionsOrderedByGraphUuid(graphUuid)(state),
    (state: RootState, graphUuid: string) =>
      selectChannelsOrderedByGraphUuid(graphUuid)(state)
  ],
  (graphBoard, outcomeGroups, outcomes, sections, channels): OutcomeTable => ({
    // tagGroups: outcomeGroups,
    // TODO: ^ uncomment, remove below
    tagGroups: [
      ...outcomeGroups,
      {
        ...outcomeGroups[0],
        title: 'This is just for testing'
      }
    ],
    board: graphBoard,
    outcomes,
    channels,
    sections
  })
)
