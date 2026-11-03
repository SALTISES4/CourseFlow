import { ContextClassification } from '@cf/api/gen'
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
import { OutcomeTableUiState } from '../slices/outcomeTableUi.slice'

export type OutcomeTable = {
  tagGroups: ReturnType<typeof selectOutcomeTagGroups>
  board: GraphBoard
  outcomeTree: ReturnType<typeof selectOutcomeTagGroupsTree>
  extraColumns: Record<'course' | 'program', ExtraColumn[]>
  groups: PreparedGroup[]
  groupedBy: 'sections' | 'channels' | 'context'

  entities: {
    sections: SectionEntity[]
    channels: ChannelEntity[]
    nodes: Record<string, NodeEntity>
  }
}

type CompletionRecord = Record<string, OutcomeCheckmarkStatus>

type PreparedGroup = {
  uuid: string
  completion: CompletionRecord
  nodes: {
    uuid: string
    completion: CompletionRecord
  }[]
}

type ExtraColumn = {
  label: string
  className?: string
  values?: Record<string, number> // nodeUuid, value
  columns?: ExtraColumn[]
}

const selectOutcomeTableGroupBy = (
  state: RootState
): OutcomeTableUiState['sortType'] => {
  const { viewType, sortType } = state.graph.outcomeTableUi
  return !sortType || viewType === 'matrix' ? 'time' : sortType
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
      selectNodeEntitiesByGraphUuid(graphUuid)(state),
    selectOutcomeTableGroupBy
  ],
  (
    graphBoard,
    outcomeGroups,
    outcomeTree,
    sections,
    channels,
    nodes,
    groupBy
  ): OutcomeTable => {
    let groupedBy: OutcomeTable['groupedBy'] = 'sections'

    let preparedGroups: PreparedGroup[] = []
    switch (groupBy) {
      case 'category':
        preparedGroups = prepareGroupsByChannel(
          graphBoard,
          channels,
          nodes,
          outcomeTree.outcomes
        )
        groupedBy = 'channels'
        break
      case 'context':
        preparedGroups = prepareGroupsByContext(
          graphBoard,
          nodes,
          outcomeTree.outcomes
        )
        groupedBy = 'context'
        break
      default:
        preparedGroups = prepareGroupsBySection(
          graphBoard,
          nodes,
          outcomeTree.outcomes
        )
    }

    const extraCourseColums: ExtraColumn[] = [
      {
        label: 'extraColumns.totalHours',
        className: 'bg-dark',
        values: { a: 10 }
      }
    ]

    const extraProgramColumns: ExtraColumn[] = [
      {
        label: 'extraColumns.classification',
        columns: [
          { label: 'extraColumns.generalEducation', values: { a: 10 } },
          { label: 'extraColumns.specificEducation', values: { a: 10 } }
        ]
      },
      {
        label: 'extraColumns.ponderation',
        columns: [
          { label: 'extraColumns.theory', values: { a: 10 } },
          { label: 'extraColumns.practical', values: { a: 10 } },
          { label: 'extraColumns.individualWork', values: { a: 10 } },
          {
            label: 'extraColumns.totalHours',
            className: 'bg-dark',
            values: { a: 10 }
          }
        ]
      },
      {
        label: 'extraColumns.totalCredits',
        className: 'bg-dark',
        values: { a: 10 }
      }
    ]

    return {
      tagGroups: outcomeGroups,
      board: graphBoard,
      outcomeTree,
      groups: preparedGroups,
      groupedBy,
      extraColumns: {
        course: extraCourseColums,
        program: extraProgramColumns
      },
      entities: {
        channels,
        sections,
        nodes
      }
    }
  }
)

type Outcomes = ReturnType<typeof selectOutcomeTagGroupsTree>['outcomes']

function getOrderedNodeUuids(
  section: GraphBoard['sections'][number]
): string[] {
  const nodeUuids: string[] = []

  for (const nodeRow of section.rows) {
    // BUG: safeguard against workflow row mode creating empty row
    if (!nodeRow) {
      continue
    }

    const positions = Object.keys(nodeRow).sort((a, b) => Number(a) - Number(b))
    for (const position of positions) {
      nodeUuids.push(nodeRow[position])
    }
  }

  return nodeUuids
}

function getNodeCompletion(
  node: NodeEntity,
  outcomes: Outcomes
): CompletionRecord {
  const completion: CompletionRecord = {}

  // outcomes the node is tagged with are fully completed
  for (const uuid of node.outcomeUuids) {
    completion[uuid] = 'full'
  }

  // their ancestors are only partially completed (unless already full)
  for (const uuid of node.outcomeUuids) {
    let parent = outcomes[uuid]?.parent
    while (parent && !completion[parent]) {
      completion[parent] = 'partial'
      parent = outcomes[parent]?.parent
    }
  }

  return completion
}

function getOutcomeStatus(
  groupNodes: PreparedGroup['nodes'],
  outcomeUuid: string
): OutcomeCheckmarkStatus {
  let anyCount = 0
  let fullCount = 0

  for (const node of groupNodes) {
    const status = node.completion[outcomeUuid]

    if (status) {
      anyCount += 1
    }
    if (status === 'full') {
      fullCount += 1
    }
  }

  if (anyCount === 0) {
    return 'empty'
  }
  if (fullCount === groupNodes.length) {
    return 'full'
  }
  return 'partial'
}

function prepareGroup(
  uuid: string,
  nodeUuids: string[],
  { nodes, outcomes }: { nodes: Record<string, NodeEntity>; outcomes: Outcomes }
): PreparedGroup {
  const groupNodes = nodeUuids.map((nodeUuid) => ({
    uuid: nodeUuid,
    completion: getNodeCompletion(nodes[nodeUuid], outcomes)
  }))

  const completion: CompletionRecord = {}
  for (const outcomeUuid of Object.keys(outcomes)) {
    completion[outcomeUuid] = getOutcomeStatus(groupNodes, outcomeUuid)
  }

  return { uuid, completion, nodes: groupNodes }
}

function prepareGroupsBySection(
  graphBoard: GraphBoard,
  nodes: Record<string, NodeEntity>,
  outcomes: Outcomes
): PreparedGroup[] {
  return graphBoard.sections.map((section) =>
    prepareGroup(section.uuid, getOrderedNodeUuids(section), {
      nodes,
      outcomes
    })
  )
}

function prepareGroupsByChannel(
  graphBoard: GraphBoard,
  channels: ChannelEntity[],
  nodes: Record<string, NodeEntity>,
  outcomes: Outcomes
): PreparedGroup[] {
  const nodeUuidsByChannel: Record<string, string[]> = {}

  for (const section of graphBoard.sections) {
    for (const nodeUuid of getOrderedNodeUuids(section)) {
      const { channelUuid } = nodes[nodeUuid]
      if (!channelUuid) {
        continue
      }

      if (!nodeUuidsByChannel[channelUuid]) {
        nodeUuidsByChannel[channelUuid] = []
      }
      nodeUuidsByChannel[channelUuid].push(nodeUuid)
    }
  }

  return channels.map((channel) => {
    const nodeUuids = nodeUuidsByChannel[channel.uuid] ?? []
    return prepareGroup(channel.uuid, nodeUuids, { nodes, outcomes })
  })
}

export const contextLabels: Record<ContextClassification, string> = {
  [ContextClassification.NONE]: 'classifications.none',
  [ContextClassification.INDIVIDUAL_WORK]: 'classifications.individual_work',
  [ContextClassification.WORK_IN_GROUPS]: 'classifications.work_in_groups',
  [ContextClassification.IN_THE_CLASSROOM]: 'classifications.in_the_classroom',
  [ContextClassification.FORMATIVE]: 'classifications.formative',
  [ContextClassification.SUMMATIVE]: 'classifications.summative',
  [ContextClassification.COMPREHENSIVE]: 'classifications.comprehensive'
}

const contextDisplayOrder = [
  ContextClassification.NONE,
  ContextClassification.INDIVIDUAL_WORK,
  ContextClassification.WORK_IN_GROUPS,
  ContextClassification.IN_THE_CLASSROOM,
  ContextClassification.FORMATIVE,
  ContextClassification.SUMMATIVE,
  ContextClassification.COMPREHENSIVE
]

function prepareGroupsByContext(
  graphBoard: GraphBoard,
  nodes: Record<string, NodeEntity>,
  outcomes: ReturnType<typeof selectOutcomeTagGroupsTree>['outcomes']
): PreparedGroup[] {
  const nodeUuidsByContext: Partial<Record<ContextClassification, string[]>> =
    {}

  for (const section of graphBoard.sections) {
    for (const nodeUuid of getOrderedNodeUuids(section)) {
      const contextClassification =
        nodes[nodeUuid]?.contextClassification ?? ContextClassification.NONE

      if (!nodeUuidsByContext[contextClassification]) {
        nodeUuidsByContext[contextClassification] = []
      }
      nodeUuidsByContext[contextClassification].push(nodeUuid)
    }
  }

  const groups: PreparedGroup[] = []

  for (const contextGroup of contextDisplayOrder) {
    const nodeUuids = nodeUuidsByContext[contextGroup] ?? []
    if (nodeUuids.length === 0) {
      continue
    }

    groups.push(
      prepareGroup(contextGroup, nodeUuids, {
        nodes,
        outcomes
      })
    )
  }

  return groups
}
