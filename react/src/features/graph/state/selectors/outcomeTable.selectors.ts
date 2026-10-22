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
  selectOutcomeTagGroups,
  selectOutcomeTagGroupsTree
} from './outcomes.selectors'
import { ChannelEntity, NodeEntity, SectionEntity } from '../model/types'

export type OutcomeTable = {
  tagGroups: ReturnType<typeof selectOutcomeTagGroups>
  board: GraphBoard
  outcomeTree: ReturnType<typeof selectOutcomeTagGroupsTree>
  sections: PreparedSection[]

  entities: {
    sections: SectionEntity[]
    channels: ChannelEntity[]
    nodes: Record<string, NodeEntity>
  }
}

type PreparedSection = {
  uuid: string
  rows: Record<string, string>[]
  status: Record<string, OutcomeCheckmarkStatus>
  nodes: {
    uuid: string
    status: Record<string, OutcomeCheckmarkStatus>
  }[]
}

export const selectOutcomeTable = createSelector(
  [
    (state: RootState, graphUuid: string) => selectGraphBoard(state, graphUuid),
    (state: RootState, graphUuid: string) =>
      selectOutcomeTagGroups(state, graphUuid),
    (state: RootState, graphUuid: string) =>
      selectOutcomeTagGroupsTree(state, graphUuid),
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
    sections,
    channels,
    nodes
  ): OutcomeTable => {
    // derive necessary sections data beforehand so the UI remains somewhat clean
    const preparedSections: PreparedSection[] = graphBoard.sections.map(
      (section) => {
        const sectionNodes: PreparedSection['nodes'] = []
        const sectionStatuses: Record<string, OutcomeCheckmarkStatus> = {}

        for (const nodeRow of section.rows) {
          // BUG: safeguard against workflow row mode creating empty row
          if (!nodeRow) {
            continue
          }

          // sort the node uuids by their row positions/indexes
          const nodePositions = Object.keys(nodeRow).sort((a, b) =>
            a.localeCompare(b)
          )

          for (const position of nodePositions) {
            const nodeUuid = nodeRow[position]
            const nodeStatuses: Record<string, OutcomeCheckmarkStatus> = {}
            const { outcomeUuids } = nodes[nodeUuid]

            // first pass - just set the completion to full
            for (const uuid of outcomeUuids) {
              nodeStatuses[uuid] = 'full'
            }

            // second pass - existing parent outcomes should be partial
            for (const uuid of outcomeUuids) {
              let parent = outcomeTree.outcomes[uuid]?.parent
              while (parent && !nodeStatuses[parent]) {
                nodeStatuses[parent] = 'partial'
                parent = outcomeTree.outcomes[parent]?.parent
              }
            }

            sectionNodes.push({ uuid: nodeUuid, status: nodeStatuses })
          }
        }

        const sectionNodeCount = sectionNodes.length
        Object.keys(outcomeTree.outcomes).forEach((uuid) => {
          const outcome = outcomeTree.outcomes[uuid]
          let fullFound = 0
          let anyFound = 0

          sectionNodes.forEach((node) => {
            const found = node.status[outcome.uuid]
            if (found) {
              anyFound += 1
            }
            if (found === 'full') {
              fullFound += 1
            }
          })

          sectionStatuses[uuid] =
            anyFound === 0
              ? 'empty'
              : fullFound === sectionNodeCount
                ? 'full'
                : 'partial'
        })

        return {
          uuid: section.uuid,
          rows: section.rows,
          status: sectionStatuses,
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
        channels,
        sections,
        nodes
      }
    }
  }
)
