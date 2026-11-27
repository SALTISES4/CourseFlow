import { ContextClassification, TagListItemOut } from '@cf/api/gen'
import type { OutcomeCheckmarkStatus } from '@cf/components/views/WorkflowView/OutcomeTableView/Checkmark'
import type { RootState } from '@cf/redux/store'
import type { ParseKeys } from 'i18next'
import { createSelector, lruMemoize } from 'reselect'

import {
  selectAllTags,
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
  format?: 'durationHours' | 'wholeHours'
  grandTotal?: {
    include: boolean
    testId: string
  }
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

const selectProjectTagLabels = createSelector([selectAllTags], (tags) =>
  tags.map<TagListItemOut>((tag) => ({
    id: Number(tag.tagId),
    label: tag.label,
    translationPlural: tag.translationPlural
  }))
)

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

type OutcomeTableSortType = NonNullable<OutcomeTableUiState['sortType']>

const selectOutcomeTableSortType = (state: RootState): OutcomeTableSortType =>
  state.graph.outcomeTableUi.sortType ?? 'time'

const makeSelectOutcomeTable = lruMemoize(
  (graphUuid: string) =>
    createSelector(
      [
        (state: RootState) => selectGraphBoard(state, graphUuid),
        (state: RootState) =>
          selectOutcomeTagGroups(
            state,
            graphUuid,
            selectProjectTagLabels(state),
            state.graph.graphUi.hiddenOutcomeTagIds
          ),
        (state: RootState) =>
          selectOutcomeTagGroupsTree(
            state,
            graphUuid,
            selectProjectTagLabels(state),
            state.graph.graphUi.hiddenOutcomeTagIds
          ),
        selectSectionsOrderedByGraphUuid(graphUuid),
        selectChannelsOrderedByGraphUuid(graphUuid),
        selectNodeEntitiesByGraphUuid(graphUuid),
        selectOutcomeTableSortType
      ],
      (
        graphBoard,
        outcomeGroups,
        outcomeTree,
        sections,
        channels,
        nodes,
        sortType
      ): OutcomeTable => {
        const extraColumnValues = createExtraColumnValues()
        const preparedGroups = prepareGroupsBySection(
          graphBoard,
          channels,
          nodes,
          outcomeTree.outcomes,
          extraColumnValues,
          sortType
        )

        const extraCourseColumns: ExtraColumn[] = [
          {
            labelKey: 'outcomeTable.summary.totalHours',
            className: 'bg-dark',
            format: 'durationHours',
            grandTotal: {
              include: true,
              testId: 'workflow-outcome-table-grand-total-hours-cell'
            },
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
                format: 'wholeHours',
                grandTotal: {
                  include: true,
                  testId:
                    'workflow-outcome-table-grand-total-general-education-cell'
                },
                nodeTestId: 'workflow-outcome-table-general-education-cell',
                sectionTestId:
                  'workflow-outcome-table-section-general-education-total',
                values: extraColumnValues.generalEducationMinutes
              },
              {
                labelKey: 'outcomeTable.summary.specificEducation',
                format: 'wholeHours',
                grandTotal: {
                  include: true,
                  testId:
                    'workflow-outcome-table-grand-total-specific-education-cell'
                },
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
                format: 'wholeHours',
                grandTotal: {
                  include: true,
                  testId: 'workflow-outcome-table-grand-total-theory-cell'
                },
                nodeTestId: 'workflow-outcome-table-theory-cell',
                sectionTestId: 'workflow-outcome-table-section-theory-total',
                values: extraColumnValues.ponderationTheoryMinutes
              },
              {
                labelKey: 'outcomeTable.summary.practical',
                format: 'wholeHours',
                grandTotal: {
                  include: true,
                  testId: 'workflow-outcome-table-grand-total-practical-cell'
                },
                nodeTestId: 'workflow-outcome-table-practical-cell',
                sectionTestId: 'workflow-outcome-table-section-practical-total',
                values: extraColumnValues.ponderationPracticalMinutes
              },
              {
                labelKey: 'outcomeTable.summary.individualWork',
                format: 'wholeHours',
                grandTotal: {
                  include: true,
                  testId: 'workflow-outcome-table-grand-total-individual-cell'
                },
                nodeTestId: 'workflow-outcome-table-individual-cell',
                sectionTestId:
                  'workflow-outcome-table-section-individual-total',
                values: extraColumnValues.ponderationIndividualMinutes
              },
              {
                labelKey: 'outcomeTable.summary.totalHours',
                className: 'bg-dark',
                format: 'wholeHours',
                grandTotal: {
                  include: true,
                  testId:
                    'workflow-outcome-table-grand-total-ponderation-hours-cell'
                },
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
            grandTotal: {
              include: false,
              testId: 'workflow-outcome-table-grand-total-credits-cell'
            },
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
          groupedBy: 'sections',
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
  channels: ChannelEntity[],
  nodes: Record<string, NodeEntity>,
  outcomes: Outcomes,
  extraColumnValues: ExtraColumnValues,
  sortType: OutcomeTableSortType
): PreparedGroup[] {
  const channelOrder = new Map(
    channels.map((channel, index) => [channel.uuid, index])
  )
  const contextOrder: Partial<Record<ContextClassification, number>> = {
    [ContextClassification.NONE]: 0,
    [ContextClassification.FORMATIVE]: 1,
    [ContextClassification.SUMMATIVE]: 2,
    [ContextClassification.COMPREHENSIVE]: 3
  }

  return graphBoard.sections.map((section) => {
    const nodeUuids = getOrderedNodeUuids(section)
    const chronologicalOrder = new Map(
      nodeUuids.map((nodeUuid, index) => [nodeUuid, index])
    )

    if (sortType !== 'time') {
      nodeUuids.sort((a, b) => {
        const nodeA = nodes[a]
        const nodeB = nodes[b]
        const rankA =
          sortType === 'category'
            ? (channelOrder.get(nodeA.channelUuid ?? '') ?? Number.MAX_VALUE)
            : (contextOrder[
                nodeA.contextClassification ?? ContextClassification.NONE
              ] ?? Number.MAX_VALUE)
        const rankB =
          sortType === 'category'
            ? (channelOrder.get(nodeB.channelUuid ?? '') ?? Number.MAX_VALUE)
            : (contextOrder[
                nodeB.contextClassification ?? ContextClassification.NONE
              ] ?? Number.MAX_VALUE)

        return (
          rankA - rankB ||
          (chronologicalOrder.get(a) ?? 0) - (chronologicalOrder.get(b) ?? 0)
        )
      })
    }

    return prepareGroup(section.uuid, nodeUuids, {
      nodes,
      outcomes,
      extraColumnValues
    })
  })
}
