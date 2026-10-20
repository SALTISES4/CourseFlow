import { OutcomeCheckmarkStatus } from '@cf/components/views/WorkflowView/OutcomeTableView/Checkmark'
import { RootState } from '@cf/redux/store'
import { createSelector } from '@reduxjs/toolkit'

import {
  selectChannelsOrderedByGraphUuid,
  selectNodeEntitiesByGraphUuid,
  selectSectionsOrderedByGraphUuid
} from './canonical.selectors'
import { GraphBoard, selectGraphBoard } from './graphBoard.selectors'
import {
  selectOutcomeEntities,
  selectOutcomeTagGroups,
  selectOutcomeTagGroupsTree
} from './outcomes.selectors'
import {
  ChannelEntity,
  NodeEntity,
  OutcomeEntity,
  SectionEntity
} from '../model/types'

export type OutcomeTable = {
  tagGroups: ReturnType<typeof selectOutcomeTagGroups>
  board: GraphBoard
  outcomeTree: ReturnType<typeof selectOutcomeTagGroupsTree>
  sections: PreparedSection[]

  entities: {
    outcomes: Record<string, OutcomeEntity>
    sections: SectionEntity[]
    channels: ChannelEntity[]
    nodes: Record<string, NodeEntity>
  }
}

type PreparedSection = {
  uuid: string
  rows: Record<string, string>[]
  nodes: {
    uuid: string
    outcomes: Record<string, boolean>
  }[]
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
      selectChannelsOrderedByGraphUuid(graphUuid)(state),
    (state: RootState, graphUuid: string) =>
      selectNodeEntitiesByGraphUuid(graphUuid)(state)
  ],
  (
    graphBoard,
    outcomeGroups,
    outcomeTree,
    outcomes,
    sections,
    channels,
    nodes
  ): OutcomeTable => {
    // derive necessary sections data beforehand so the UI remains somewhat clean
    const preparedSections: PreparedSection[] = graphBoard.sections.map(
      (section) => {
        const sectionNodes = section.rows.reduce<
          { uuid: string; outcomes: PreparedSection['nodes'][0]['outcomes'] }[]
        >((acc, row) => {
          const keys = Object.keys(row).sort((a, b) => a.localeCompare(b))
          const rowUuids = keys.map((key) => row[key])

          return [
            ...acc,
            ...rowUuids.map((nodeUuid) => {
              const outcomes: PreparedSection['nodes'][0]['outcomes'] = {}

              nodes[nodeUuid].outcomeUuids.forEach((uuid) => {
                outcomes[uuid] = true
              })

              return { uuid: nodeUuid, outcomes }
            })
          ]
        }, [])

        return {
          uuid: section.uuid,
          rows: section.rows,
          nodes: sectionNodes
        }
      }
    )

    return {
      tagGroups: outcomeGroups,
      board: graphBoard,
      outcomeTree,
      sections: preparedSections,
      entities: {
        outcomes,
        channels,
        sections,
        nodes
      }
    }
  }
)
