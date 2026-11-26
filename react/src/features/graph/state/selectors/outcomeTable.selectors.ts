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
import type {
  ChannelEntity,
  NodeEntity,
  ResourceUuid,
  SectionEntity
} from '../model/types'
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
  format?: 'durationHours'
  headerTestId?: string
  nodeTestId?: string
  sectionTestId?: string
  values: Record<string, number | null | undefined> // nodeUuid or groupUuid, value
}

type ExtraColumnGroup = {
  labelKey: ExtraColumnLabelKey
  columns: ExtraColumnLeaf[]
}

type ExtraColumn = ExtraColumnLeaf | ExtraColumnGroup

type ExtraColumnValueKey =
  | 'totalCredits'
  | 'totalDurationMinutes'
  | 'ponderationTotalMinutes'
  | 'generalEducationMinutes'
  | 'specificEducationMinutes'
  | 'ponderationTheoryMinutes'
  | 'ponderationPracticalMinutes'
  | 'ponderationIndividualMinutes'

type ExtraColumnValues = Record<
  ExtraColumnValueKey,
  Record<string, number | null | undefined>
>

const createExtraColumnValues = (): ExtraColumnValues => ({
  totalCredits: {},
  totalDurationMinutes: {},
  ponderationTotalMinutes: {},
  generalEducationMinutes: {},
  specificEducationMinutes: {},
  ponderationTheoryMinutes: {},
  ponderationPracticalMinutes: {},
  ponderationIndividualMinutes: {}
})

const selectOutcomeTableUi = (state: RootState) => state.graph.outcomeTableUi
const selectExpandMode = (state: RootState) =>
  selectOutcomeTableUi(state).expandMode
const selectExpandedOverrides = (state: RootState) =>
  selectOutcomeTableUi(state).expandedOverrides

export const selectIsOutcomeExpanded = createSelector(
  [
    selectExpandMode,
    selectExpandedOverrides,
    (_: RootState, outcomeUuid: ResourceUuid) => outcomeUuid
  ],
  (expandMode, expandedOverrides, outcomeUuid) => {
    const overridden = expandedOverrides[outcomeUuid] === true
    const baseline = expandMode === 'expandAll'
    return overridden ? !baseline : baseline
  }
)

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
            format: 'durationHours',
            headerTestId: 'workflow-outcome-table-total-hours-column',
            nodeTestId: 'workflow-outcome-table-total-hours-cell',
            sectionTestId: 'workflow-outcome-table-section-total-hours-total',
            values: extraColumnValues.totalDurationMinutes
          }
        ]

        const extraProgramColumns: ExtraColumn[] = [
          {
            labelKey: 'outcomeTable.summary.classification',
            columns: [
              {
                labelKey: 'outcomeTable.summary.generalEducation',
                format: 'durationHours',
                nodeTestId: 'workflow-outcome-table-general-education-cell',
                sectionTestId:
                  'workflow-outcome-table-section-general-education-total',
                values: extraColumnValues.generalEducationMinutes
              },
              {
                labelKey: 'outcomeTable.summary.specificEducation',
                format: 'durationHours',
                nodeTestId: 'workflow-outcome-table-specific-education-cell',
                sectionTestId:
                  'workflow-outcome-table-section-specific-education-total',
                values: extraColumnValues.specificEducationMinutes
              }
            ]
          },
          {
            labelKey: 'outcomeTable.summary.ponderation',
            columns: [
              {
                labelKey: 'outcomeTable.summary.theory',
                format: 'durationHours',
                nodeTestId: 'workflow-outcome-table-theory-cell',
                sectionTestId: 'workflow-outcome-table-section-theory-total',
                values: extraColumnValues.ponderationTheoryMinutes
              },
              {
                labelKey: 'outcomeTable.summary.practical',
                format: 'durationHours',
                nodeTestId: 'workflow-outcome-table-practical-cell',
                sectionTestId: 'workflow-outcome-table-section-practical-total',
                values: extraColumnValues.ponderationPracticalMinutes
              },
              {
                labelKey: 'outcomeTable.summary.individualWork',
                format: 'durationHours',
                nodeTestId: 'workflow-outcome-table-individual-cell',
                sectionTestId:
                  'workflow-outcome-table-section-individual-total',
                values: extraColumnValues.ponderationIndividualMinutes
              },
              {
                labelKey: 'outcomeTable.summary.totalHours',
                className: 'bg-dark',
                format: 'durationHours',
                nodeTestId: 'workflow-outcome-table-ponderation-total-cell',
                sectionTestId:
                  'workflow-outcome-table-section-ponderation-total-total',
                values: extraColumnValues.ponderationTotalMinutes
              }
            ]
          },
          {
            labelKey: 'outcomeTable.summary.credits',
            className: 'bg-dark',
            nodeTestId: 'workflow-outcome-table-credits-cell',
            sectionTestId: 'workflow-outcome-table-section-credits-total',
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

// loop through each node to gather data for the extra columns
// as well as the section totals
function populateExtraColumns(
  groupUuid: string,
  node: NodeEntity,
  extraColumnValues: ExtraColumnValues
) {
  const linkedWorkflow = node.linkedWorkflow?.overviewMetadata

  const theory =
    linkedWorkflow?.theoryTimeMinutes ?? node.ponderationTheoryMinutes
  const practice =
    linkedWorkflow?.practicalTimeMinutes ?? node.ponderationPracticeMinutes
  const individual =
    linkedWorkflow?.individualTimeMinutes ?? node.ponderationIndividualMinutes
  const isSpecific =
    linkedWorkflow?.specificTimeMinutes ?? node.specificEducation

  const timeRequired = linkedWorkflow?.timeMinutes ?? node.timeRequiredMinutes

  const values: Record<ExtraColumnValueKey, number | null | undefined> = {
    specificEducationMinutes: isSpecific ? timeRequired : undefined,
    generalEducationMinutes: isSpecific ? undefined : timeRequired,
    ponderationTheoryMinutes: theory,
    ponderationPracticalMinutes: practice,
    ponderationIndividualMinutes: individual,
    totalDurationMinutes: timeRequired,
    ponderationTotalMinutes: sumNullableValues([theory, practice, individual]),
    totalCredits: node.credits
  }

  for (const column of Object.keys(values) as ExtraColumnValueKey[]) {
    const value = values[column]
    const columnValues = extraColumnValues[column]

    // Undefined means that the column does not apply to this node. Null means
    // that the column applies but the user has not entered a value.
    if (value === undefined) {
      continue
    }

    columnValues[node.uuid] = value
    if (!(groupUuid in columnValues)) {
      columnValues[groupUuid] = null
    }
    if (value !== null) {
      columnValues[groupUuid] = (columnValues[groupUuid] ?? 0) + value
    }
  }
}

function sumNullableValues(
  values: Array<number | null | undefined>
): number | null {
  const setValues = values.filter((value): value is number => value != null)
  if (setValues.length === 0) {
    return null
  }
  return setValues.reduce((total, value) => total + value, 0)
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
