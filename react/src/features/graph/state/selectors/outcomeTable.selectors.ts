import { ContextClassification } from '@cf/api/gen'
import type { OutcomeCheckmarkStatus } from '@cf/components/views/WorkflowView/OutcomeTableView/Checkmark'
import type { RootState } from '@cf/redux/store'
import type { ParseKeys } from 'i18next'
import { createSelector, lruMemoize } from 'reselect'

import {
  selectChannelsOrderedByGraphUuid,
  selectNodeEntitiesByGraphUuid,
  selectSectionsOrderedByGraphUuid
} from './canonical.selectors'
import { selectGraphBoard } from './graphBoard.selectors'
import type { GraphBoard } from './graphBoard.selectors'
import {
  selectOutcomeTagGroups,
  selectOutcomeTagGroupsTree
} from './outcomes.selectors'
import type { ChannelEntity, NodeEntity, SectionEntity } from '../model/types'
import type { OutcomeTableUiState } from '../slices/outcomeTableUi.slice'

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

type ExtraColumnLabelKey = Extract<
  ParseKeys<'workflow'>,
  `outcomeTable.summary.${string}`
>

type ExtraColumnLeaf = {
  labelKey: ExtraColumnLabelKey
  className?: string
  values: Record<string, number> // nodeUuid, value
}

type ExtraColumnGroup = {
  labelKey: ExtraColumnLabelKey
  columns: ExtraColumnLeaf[]
}

type ExtraColumn = ExtraColumnLeaf | ExtraColumnGroup

type ExtraColumnValueKey =
  | 'totalCredits'
  | 'totalHours'
  | 'generalEducation'
  | 'specificEducation'
  | 'ponderationTheory'
  | 'ponderationPractical'
  | 'ponderationIndividual'

type ExtraColumnValues = Record<ExtraColumnValueKey, Record<string, number>>

const createExtraColumnValues = (): ExtraColumnValues => ({
  totalCredits: {},
  totalHours: {},
  generalEducation: {},
  specificEducation: {},
  ponderationTheory: {},
  ponderationPractical: {},
  ponderationIndividual: {}
})

// 
const selectOutcomeTableGroupBy = (
  state: RootState
): OutcomeTableUiState['sortType'] => {
  const { viewType, sortType } = state.graph.outcomeTableUi
  return !sortType || viewType === 'matrix' ? 'time' : sortType
}

const makeSelectOutcomeTable = lruMemoize(
  (graphUuid: string) =>
    createSelector(
      [
        (state: RootState) => selectGraphBoard(state, graphUuid),
        (state: RootState) => selectOutcomeTagGroups(state, graphUuid),
        (state: RootState) => selectOutcomeTagGroupsTree(state, graphUuid),
        selectSectionsOrderedByGraphUuid(graphUuid),
        selectChannelsOrderedByGraphUuid(graphUuid),
        selectNodeEntitiesByGraphUuid(graphUuid),
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
        const extraColumnValues = createExtraColumnValues()

        let preparedGroups: PreparedGroup[] = []
        switch (groupBy) {
          case 'category':
            preparedGroups = prepareGroupsByChannel(
              graphBoard,
              channels,
              nodes,
              outcomeTree.outcomes,
              extraColumnValues
            )
            groupedBy = 'channels'
            break
          case 'context':
            preparedGroups = prepareGroupsByContext(
              graphBoard,
              nodes,
              outcomeTree.outcomes,
              extraColumnValues
            )
            groupedBy = 'context'
            break
          default:
            preparedGroups = prepareGroupsBySection(
              graphBoard,
              nodes,
              outcomeTree.outcomes,
              extraColumnValues
            )
        }

        const extraCourseColumns: ExtraColumn[] = [
          {
            labelKey: 'outcomeTable.summary.totalHours',
            className: 'bg-dark',
            values: extraColumnValues.totalHours
          }
        ]

        const extraProgramColumns: ExtraColumn[] = [
          {
            labelKey: 'outcomeTable.summary.classification',
            columns: [
              {
                labelKey: 'outcomeTable.summary.generalEducation',
                values: extraColumnValues.generalEducation
              },
              {
                labelKey: 'outcomeTable.summary.specificEducation',
                values: extraColumnValues.specificEducation
              }
            ]
          },
          {
            labelKey: 'outcomeTable.summary.ponderation',
            columns: [
              {
                labelKey: 'outcomeTable.summary.theory',
                values: extraColumnValues.ponderationTheory
              },
              {
                labelKey: 'outcomeTable.summary.practical',
                values: extraColumnValues.ponderationPractical
              },
              {
                labelKey: 'outcomeTable.summary.individualWork',
                values: extraColumnValues.ponderationIndividual
              },
              {
                labelKey: 'outcomeTable.summary.totalHours',
                className: 'bg-dark',
                values: extraColumnValues.totalHours
              }
            ]
          },
          {
            labelKey: 'outcomeTable.summary.credits',
            className: 'bg-dark',
            values: extraColumnValues.totalCredits
          }
        ]

        return {
          tagGroups: outcomeGroups,
          board: graphBoard,
          outcomeTree,
          groups: preparedGroups,
          groupedBy,
          extraColumns: {
            course: extraCourseColumns,
            program: extraProgramColumns
          },
          entities: {
            channels,
            sections,
            nodes
          }
        }
      }
    ),
  { maxSize: 32 }
)

export function selectOutcomeTable(
  state: RootState,
  graphUuid: string
): OutcomeTable {
  return makeSelectOutcomeTable(graphUuid)(state)
}

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

function populateExtraColumns(
  groupUuid: string,
  node: NodeEntity,
  extraColumnValues: ExtraColumnValues
) {
  const theory = node.ponderationTheory ?? 0
  const practice = node.ponderationPractice ?? 0
  const individual = node.ponderationIndividual ?? 0

  const isSpecific = node.specificEducation
  // TODO: figure out how timeUnits affects the timeRequired
  // and what the "normalized" value is (ie, hour/day/etc)

  const values: Record<ExtraColumnValueKey, number> = {
    specificEducation: isSpecific ? (node.timeRequired ?? 0) : 0,
    generalEducation: !isSpecific ? (node.timeRequired ?? 0) : 0,
    ponderationTheory: theory,
    ponderationPractical: practice,
    ponderationIndividual: individual,
    totalHours: theory + practice + individual,
    totalCredits: node.credits ?? 0
  }

  for (const column of Object.keys(values) as ExtraColumnValueKey[]) {
    const value = values[column]
    const columnValues = extraColumnValues[column]
    columnValues[node.uuid] = value
    columnValues[groupUuid] = (columnValues[groupUuid] ?? 0) + value
  }
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
  {
    nodes,
    outcomes,
    extraColumnValues
  }: {
    nodes: Record<string, NodeEntity>
    outcomes: Outcomes
    extraColumnValues: ExtraColumnValues
  }
): PreparedGroup {
  const groupNodes = nodeUuids.map((nodeUuid) => {
    const node = nodes[nodeUuid]
    populateExtraColumns(uuid, node, extraColumnValues)
    return { uuid: nodeUuid, completion: getNodeCompletion(node, outcomes) }
  })

  const completion: CompletionRecord = {}
  for (const outcomeUuid of Object.keys(outcomes)) {
    completion[outcomeUuid] = getOutcomeStatus(groupNodes, outcomeUuid)
  }

  return { uuid, completion, nodes: groupNodes }
}

function prepareGroupsBySection(
  graphBoard: GraphBoard,
  nodes: Record<string, NodeEntity>,
  outcomes: Outcomes,
  extraColumnValues: ExtraColumnValues
): PreparedGroup[] {
  return graphBoard.sections.map((section) =>
    prepareGroup(section.uuid, getOrderedNodeUuids(section), {
      nodes,
      outcomes,
      extraColumnValues
    })
  )
}

function prepareGroupsByChannel(
  graphBoard: GraphBoard,
  channels: ChannelEntity[],
  nodes: Record<string, NodeEntity>,
  outcomes: Outcomes,
  extraColumnValues: ExtraColumnValues
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
    return prepareGroup(channel.uuid, nodeUuids, {
      nodes,
      outcomes,
      extraColumnValues
    })
  })
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
  outcomes: ReturnType<typeof selectOutcomeTagGroupsTree>['outcomes'],
  extraColumnValues: ExtraColumnValues
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
        outcomes,
        extraColumnValues
      })
    )
  }

  return groups
}
