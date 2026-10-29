import { ContextClassification, TagListItemOut } from '@cf/api/gen/types.gen'
import { OutcomeCheckmarkStatus } from '@cf/components/views/WorkflowView/OutcomeTableView/Checkmark'
import { RootState } from '@cf/redux/store'
import { createSelector } from '@reduxjs/toolkit'

import {
  selectAllTags,
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
import type { OutcomeTableSortMode } from '../slices/outcomeTableUi.slice'

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

type CompletionRecord = Record<string, OutcomeCheckmarkStatus>

type PreparedSection = {
  uuid: string
  rows: Record<string, string>[]
  completion: CompletionRecord
  nodes: {
    uuid: string
    completion: CompletionRecord
  }[]
}

const selectProjectTagLabels = createSelector([selectAllTags], (tags) =>
  tags.map<TagListItemOut>((tag) => ({
    id: Number(tag.tagId),
    label: tag.label,
    translationPlural: tag.translationPlural
  }))
)

const CONTEXT_ORDER: Record<string, number> = {
  [ContextClassification.NONE]: 0,
  [ContextClassification.FORMATIVE]: 1,
  [ContextClassification.SUMMATIVE]: 2,
  [ContextClassification.COMPREHENSIVE]: 3
}

export const selectOutcomeTable = createSelector(
  [
    (state: RootState, graphUuid: string) => selectGraphBoard(state, graphUuid),
    (state: RootState, graphUuid: string) =>
      selectOutcomeTagGroups(
        state,
        graphUuid,
        selectProjectTagLabels(state),
        state.graph.graphUi.hiddenOutcomeTagIds
      ),
    (state: RootState, graphUuid: string) =>
      selectOutcomeTagGroupsTree(
        state,
        graphUuid,
        selectProjectTagLabels(state),
        state.graph.graphUi.hiddenOutcomeTagIds
      ),
    (state: RootState, graphUuid: string) =>
      selectSectionsOrderedByGraphUuid(graphUuid)(state),
    (state: RootState, graphUuid: string) =>
      selectChannelsOrderedByGraphUuid(graphUuid)(state),
    (state: RootState, graphUuid: string) =>
      selectNodeEntitiesByGraphUuid(graphUuid)(state),
    (state: RootState): OutcomeTableSortMode =>
      state.graph.outcomeTableUi.sortMode
  ],
  (
    graphBoard,
    outcomeGroups,
    outcomeTree,
    sections,
    channels,
    nodes,
    sortMode
  ): OutcomeTable => {
    // derive necessary sections data beforehand so the UI remains somewhat clean
    const preparedSections: PreparedSection[] = graphBoard.sections.map(
      (section) => {
        const sectionNodes: PreparedSection['nodes'] = []
        const sectionCompletion: CompletionRecord = {}

        for (const nodeRow of section.rows) {
          // BUG: safeguard against workflow row mode creating empty row
          if (!nodeRow) {
            continue
          }

          // sort the node uuids by their row positions/indexes
          const nodePositions = Object.keys(nodeRow).sort(
            (a, b) => Number(a) - Number(b)
          )

          for (const position of nodePositions) {
            const nodeUuid = nodeRow[position]
            const outcomeCompletion: CompletionRecord = {}
            const { outcomeUuids } = nodes[nodeUuid]

            // first pass - just set the completion to full
            for (const uuid of outcomeUuids) {
              outcomeCompletion[uuid] = 'full'
            }

            // second pass - existing parent outcomes should be partial
            for (const uuid of outcomeUuids) {
              let parent = outcomeTree.outcomes[uuid]?.parent
              while (parent && !outcomeCompletion[parent]) {
                outcomeCompletion[parent] = 'partial'
                parent = outcomeTree.outcomes[parent]?.parent
              }
            }

            sectionNodes.push({ uuid: nodeUuid, completion: outcomeCompletion })
          }
        }

        const sectionNodeCount = sectionNodes.length

        if (sortMode !== 'chronological') {
          const channelOrder = new Map(
            channels.map((channel, index) => [channel.uuid, index])
          )
          const originalOrder = new Map(
            sectionNodes.map((node, index) => [node.uuid, index])
          )

          sectionNodes.sort((a, b) => {
            const nodeA = nodes[a.uuid]
            const nodeB = nodes[b.uuid]
            const rankA =
              sortMode === 'nodeCategory'
                ? (channelOrder.get(nodeA.channelUuid ?? '') ??
                  Number.MAX_VALUE)
                : (CONTEXT_ORDER[
                    nodeA.contextClassification ?? ContextClassification.NONE
                  ] ?? Number.MAX_VALUE)
            const rankB =
              sortMode === 'nodeCategory'
                ? (channelOrder.get(nodeB.channelUuid ?? '') ??
                  Number.MAX_VALUE)
                : (CONTEXT_ORDER[
                    nodeB.contextClassification ?? ContextClassification.NONE
                  ] ?? Number.MAX_VALUE)

            return (
              rankA - rankB ||
              (originalOrder.get(a.uuid) ?? 0) -
                (originalOrder.get(b.uuid) ?? 0)
            )
          })
        }

        Object.keys(outcomeTree.outcomes).forEach((uuid) => {
          const outcome = outcomeTree.outcomes[uuid]
          let fullFound = 0
          let anyFound = 0

          sectionNodes.forEach((node) => {
            const found = node.completion[outcome.uuid]
            if (found) {
              anyFound += 1
            }
            if (found === 'full') {
              fullFound += 1
            }
          })

          sectionCompletion[uuid] =
            anyFound === 0
              ? 'empty'
              : fullFound === sectionNodeCount
                ? 'full'
                : 'partial'
        })

        return {
          uuid: section.uuid,
          rows: section.rows,
          completion: sectionCompletion,
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
