import {
  TimeUnit,
  WorkflowPermission,
  WorkflowType
} from '@cf/api/gen/types.gen'
import { nodeTitleFallback } from '@cf/components/pages/Workflow/Sidebar/components/EditTab/components/EditNode/linkedWorkflowUi'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import { OutcomeTable } from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import { outcomeTableUiActions } from '@cf/features/graph/state/slices/outcomeTableUi.slice'
import {
  linkNodeOutcome,
  unlinkNodeOutcome
} from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { displaySystemTitle } from '@cf/i18n/systemTitles'
import { AppDispatch, RootState } from '@cf/redux/store'
import OutcomeHeader from '@cfPages/Workflow/Sidebar/components/OutcomesTab/Outcome/Header'
import Tooltip from '@mui/material/Tooltip'
import type { TFunction } from 'i18next'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import Checkmark, { OutcomeCheckmarkStatus } from '../Checkmark'
import {
  durationToWholeHours,
  formatWholeHours,
  sumDefinedValues
} from '../duration'
import * as Styled from '../styles'

type PropsType = {
  viewType: 'normal' | 'matrix'
  table: OutcomeTable
  workflowType: WorkflowType
}

type ToggleAssignment = (
  nodeUuid: string,
  outcomeUuid: string,
  status: OutcomeCheckmarkStatus
) => void

const nodeDisplayTitle = (
  t: TFunction<'workflow'>,
  table: OutcomeTable,
  nodeUuid: string
) => {
  const node = table.entities.nodes[nodeUuid]
  if (node.linkedWorkflowUuid) {
    return node.title || nodeTitleFallback(t('linked.untitledNode'))
  }
  return displaySystemTitle(
    t,
    node,
    nodeTitleFallback(t('linked.untitledNode'))
  )
}

const OutcomeTableBody = ({ viewType, table, workflowType }: PropsType) => {
  const dispatch = useDispatch<AppDispatch>()
  const canAssignOutcomes = useResourcePermission(
    WorkflowPermission.ASSIGN_OUTCOMES
  )
  const [assignmentPending, setAssignmentPending] = useState(false)

  const toggleAssignment = useCallback<ToggleAssignment>(
    (nodeUuid, outcomeUuid, status) => {
      if (!canAssignOutcomes || assignmentPending) {
        return
      }

      const params = { graphUuid: table.board.uuid, nodeUuid, outcomeUuid }
      const mutation =
        status === 'full' ? unlinkNodeOutcome(params) : linkNodeOutcome(params)

      setAssignmentPending(true)
      void dispatch(mutation)
        .catch(() => undefined)
        .finally(() => setAssignmentPending(false))
    },
    [assignmentPending, canAssignOutcomes, dispatch, table.board.uuid]
  )

  return (
    <Styled.TableBody>
      {viewType === 'normal' ? (
        <TagGroups
          table={table}
          readOnly={!canAssignOutcomes || assignmentPending}
          toggleAssignment={toggleAssignment}
        />
      ) : (
        <SectionGroups
          table={table}
          workflowType={workflowType}
          readOnly={!canAssignOutcomes || assignmentPending}
          toggleAssignment={toggleAssignment}
        />
      )}
    </Styled.TableBody>
  )
}

const SectionGroups = ({
  table,
  workflowType,
  readOnly,
  toggleAssignment
}: {
  table: OutcomeTable
  workflowType: WorkflowType
  readOnly: boolean
  toggleAssignment: ToggleAssignment
}) => {
  const { t, i18n } = useTranslation('workflow')
  const expandedOutcomes = useSelector(
    (state: RootState) => state.graph.outcomeTableUi.expandedOutcomes
  )
  const visibleOutcomes = useMemo(() => {
    const entries: (
      | { type: 'group'; key: string }
      | { type: 'outcome'; uuid: string }
    )[] = []
    const appendOutcome = (uuid: string) => {
      entries.push({ type: 'outcome', uuid })
      if (expandedOutcomes[uuid]) {
        table.outcomeTree.outcomes[uuid]?.children.forEach(appendOutcome)
      }
    }
    table.tagGroups.forEach((group) => {
      entries.push({ type: 'group', key: String(group.uuid) })
      group.outcomes.forEach(appendOutcome)
    })
    return entries
  }, [expandedOutcomes, table.outcomeTree.outcomes, table.tagGroups])

  return table.entities.sections.map((section, index) => {
    const sectionDefaultTitle = t('systemLabels.sectionNumber', {
      number: (section.position ?? 0) + 1
    })
    const sectionTitle = displaySystemTitle(t, section, sectionDefaultTitle)
    const preparedSection = table.sections[index]

    return (
      <Styled.TagGroup
        key={section.uuid}
        role="rowgroup"
        aria-label={sectionTitle}
      >
        <Styled.BodyRow role="row">
          <Styled.BodyLegendWrap>
            <Styled.TableLegend role="rowheader">
              {sectionTitle}
            </Styled.TableLegend>
          </Styled.BodyLegendWrap>
          <Styled.CheckmarkGroup className="Checkmarks-root">
            {visibleOutcomes.map((entry) =>
              entry.type === 'group' ? (
                <Styled.CheckmarkCell key={`group-${entry.key}`} aria-hidden />
              ) : (
                <Checkmark
                  key={entry.uuid}
                  readOnly
                  label={t('outcomeTable.sectionRollupCellLabel', {
                    outcome: table.outcomeTree.outcomes[entry.uuid]?.title,
                    section: sectionTitle
                  })}
                  sx={{ background: '#eef2fd' }}
                  value={preparedSection.completion[entry.uuid] ?? 'empty'}
                />
              )
            )}
          </Styled.CheckmarkGroup>
          <SummaryCells
            values={sectionSummaryValues(
              preparedSection.nodes.map(
                (node) => table.entities.nodes[node.uuid]
              ),
              workflowType,
              i18n.language
            )}
            sectionTotal
          />
        </Styled.BodyRow>

        {preparedSection.nodes.map((preparedNode) => {
          const node = table.entities.nodes[preparedNode.uuid]
          const color = table.board.columns.colors[node.channelUuid ?? '']
          const title = nodeDisplayTitle(t, table, preparedNode.uuid)

          return (
            <Styled.BodyRow key={preparedNode.uuid} role="row">
              <Styled.BodyLegendWrap>
                <Tooltip placement="top" arrow disableInteractive title={title}>
                  <Styled.TableLegend color={color} role="rowheader">
                    {title}
                  </Styled.TableLegend>
                </Tooltip>
              </Styled.BodyLegendWrap>
              <Styled.CheckmarkGroup className="Checkmarks-root">
                {visibleOutcomes.map((entry) => {
                  if (entry.type === 'group') {
                    return (
                      <Styled.CheckmarkCell
                        key={`group-${entry.key}`}
                        aria-hidden
                      />
                    )
                  }
                  const outcome = table.outcomeTree.outcomes[entry.uuid]
                  const status = preparedNode.completion[entry.uuid] ?? 'empty'
                  return (
                    <Checkmark
                      key={entry.uuid}
                      label={t('outcomeTable.assignmentCellLabel', {
                        outcome: outcome.title,
                        node: title
                      })}
                      readOnly={readOnly}
                      value={status}
                      onClick={() =>
                        toggleAssignment(preparedNode.uuid, entry.uuid, status)
                      }
                    />
                  )
                })}
              </Styled.CheckmarkGroup>
              <SummaryCells
                values={nodeSummaryValues(node, workflowType, i18n.language)}
              />
            </Styled.BodyRow>
          )
        })}
      </Styled.TagGroup>
    )
  })
}

type SummaryValue = { key: string; value: string }
type TableNode = OutcomeTable['entities']['nodes'][string]

const displayDuration = (
  hours: number | null | undefined,
  locale: string
): string => (typeof hours === 'number' ? formatWholeHours(hours, locale) : '—')

const nodePonderationTotal = (node: TableNode) =>
  sumDefinedValues([
    durationToWholeHours(node.ponderationTheory, TimeUnit.HOURS),
    durationToWholeHours(node.ponderationPractice, TimeUnit.HOURS),
    durationToWholeHours(node.ponderationIndividual, TimeUnit.HOURS)
  ])

const nodeSummaryValues = (
  node: TableNode,
  workflowType: WorkflowType,
  locale: string
): SummaryValue[] => {
  const time = durationToWholeHours(node.timeRequired, node.timeUnits)
  if (workflowType === WorkflowType.COURSE) {
    return [{ key: 'total-hours', value: displayDuration(time, locale) }]
  }

  return [
    {
      key: 'general-education',
      value: node.specificEducation ? '' : displayDuration(time, locale)
    },
    {
      key: 'specific-education',
      value: node.specificEducation ? displayDuration(time, locale) : ''
    },
    {
      key: 'theory',
      value: displayDuration(
        durationToWholeHours(node.ponderationTheory, TimeUnit.HOURS),
        locale
      )
    },
    {
      key: 'practical',
      value: displayDuration(
        durationToWholeHours(node.ponderationPractice, TimeUnit.HOURS),
        locale
      )
    },
    {
      key: 'individual',
      value: displayDuration(
        durationToWholeHours(node.ponderationIndividual, TimeUnit.HOURS),
        locale
      )
    },
    {
      key: 'ponderation-total',
      value: displayDuration(nodePonderationTotal(node), locale)
    },
    {
      key: 'credits',
      value: node.credits == null ? '—' : String(node.credits)
    }
  ]
}

const sectionSummaryValues = (
  nodes: TableNode[],
  workflowType: WorkflowType,
  locale: string
): SummaryValue[] => {
  if (workflowType === WorkflowType.COURSE) {
    return [
      {
        key: 'total-hours',
        value: displayDuration(
          sumDefinedValues(
            nodes.map((node) =>
              durationToWholeHours(node.timeRequired, node.timeUnits)
            )
          ),
          locale
        )
      }
    ]
  }

  const timeValues = (specificEducation: boolean) =>
    nodes
      .filter((node) => node.specificEducation === specificEducation)
      .map((node) => durationToWholeHours(node.timeRequired, node.timeUnits))
  const ponderationValues = (
    field: 'ponderationTheory' | 'ponderationPractice' | 'ponderationIndividual'
  ) => nodes.map((node) => durationToWholeHours(node[field], TimeUnit.HOURS))

  return [
    {
      key: 'general-education',
      value: displayDuration(sumDefinedValues(timeValues(false)), locale)
    },
    {
      key: 'specific-education',
      value: displayDuration(sumDefinedValues(timeValues(true)), locale)
    },
    {
      key: 'theory',
      value: displayDuration(
        sumDefinedValues(ponderationValues('ponderationTheory')),
        locale
      )
    },
    {
      key: 'practical',
      value: displayDuration(
        sumDefinedValues(ponderationValues('ponderationPractice')),
        locale
      )
    },
    {
      key: 'individual',
      value: displayDuration(
        sumDefinedValues(ponderationValues('ponderationIndividual')),
        locale
      )
    },
    {
      key: 'ponderation-total',
      value: displayDuration(
        sumDefinedValues(nodes.map(nodePonderationTotal)),
        locale
      )
    },
    {
      key: 'credits',
      value: nodes.some((node) => node.credits != null)
        ? String(nodes.reduce((total, node) => total + (node.credits ?? 0), 0))
        : '—'
    }
  ]
}

const SummaryCells = ({
  values,
  sectionTotal = false
}: {
  values: SummaryValue[]
  sectionTotal?: boolean
}) => (
  <Styled.CheckmarkGroup>
    {values.map(({ key, value }) => (
      <Styled.SummaryCell
        key={key}
        role="gridcell"
        data-test-id={
          sectionTotal
            ? `workflow-outcome-table-section-${key}-total`
            : `workflow-outcome-table-${key}-cell`
        }
      >
        {value}
      </Styled.SummaryCell>
    ))}
  </Styled.CheckmarkGroup>
)

const TagGroups = ({
  table,
  readOnly,
  toggleAssignment
}: {
  table: OutcomeTable
  readOnly: boolean
  toggleAssignment: ToggleAssignment
}) => {
  const { t } = useTranslation('workflow')
  const hasTaggedGroups = table.tagGroups.some((group) => group.uuid !== -1)

  return table.tagGroups.map((group) => {
    const groupTitle =
      group.title || (hasTaggedGroups ? t('outcomes.untagged') : '')
    return (
      <Styled.TagGroup
        key={group.uuid}
        role="rowgroup"
        aria-label={groupTitle || t('outcomes.title')}
        data-test-id="workflow-outcome-table-tag-group"
      >
        <Styled.BodyRow className="Tagheader-root" role="row">
          <Styled.BodyLegendWrap>
            <Styled.TableLegend>{groupTitle}</Styled.TableLegend>
          </Styled.BodyLegendWrap>
          <Styled.BodyLegendWrap />
        </Styled.BodyRow>

        {group.outcomes.map((outcomeUuid) => (
          <TagGroupRow
            key={outcomeUuid}
            table={table}
            uuid={outcomeUuid}
            readOnly={readOnly}
            toggleAssignment={toggleAssignment}
          />
        ))}
      </Styled.TagGroup>
    )
  })
}

const TagGroupRow = ({
  table,
  uuid,
  readOnly,
  toggleAssignment
}: {
  table: OutcomeTable
  uuid: string
  readOnly: boolean
  toggleAssignment: ToggleAssignment
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const { t } = useTranslation('workflow')
  const expandedOutcomes = useSelector(
    (state: RootState) => state.graph.outcomeTableUi.expandedOutcomes
  )
  const outcome = table.outcomeTree.outcomes[uuid]
  const collapsed = !expandedOutcomes[uuid]
  const onOutcomeToggleClick = useCallback(() => {
    dispatch(outcomeTableUiActions.outcomeExpand({ uuid }))
  }, [dispatch, uuid])

  return (
    <>
      <Styled.BodyRow role="row">
        <Styled.BodyLegendWrap
          role="rowheader"
          aria-label={outcome.title}
          tabIndex={0}
          title={outcome.title}
        >
          <OutcomeHeader
            uuid={uuid}
            level={outcome.level}
            title={outcome.title}
            tooltip={outcome.title}
            collapsed={collapsed}
            showToggle={!!outcome.children.length}
            setCollapsed={() => {}}
            onToggleClick={onOutcomeToggleClick}
          />
        </Styled.BodyLegendWrap>

        <Styled.CheckmarkGroup className="Checkmarks-root">
          {table.sections.map((section, sectionIndex) => (
            <Styled.CheckmarkGroup key={section.uuid}>
              <Checkmark
                readOnly
                label={t('outcomeTable.sectionRollupCellLabel', {
                  outcome: outcome.title,
                  section:
                    table.entities.sections[sectionIndex]?.title ||
                    t('systemLabels.sectionNumber', {
                      number:
                        (table.entities.sections[sectionIndex]?.position ?? 0) +
                        1
                    })
                })}
                sx={{ background: '#eef2fd' }}
                value={section.completion[outcome.uuid] ?? 'empty'}
              />
              {section.nodes.map((node) => {
                const status = node.completion[outcome.uuid] ?? 'empty'
                const nodeTitle = nodeDisplayTitle(t, table, node.uuid)
                return (
                  <Checkmark
                    key={node.uuid}
                    label={t('outcomeTable.assignmentCellLabel', {
                      outcome: outcome.title,
                      node: nodeTitle
                    })}
                    readOnly={readOnly}
                    value={status}
                    onClick={() =>
                      toggleAssignment(node.uuid, outcome.uuid, status)
                    }
                  />
                )
              })}
            </Styled.CheckmarkGroup>
          ))}
        </Styled.CheckmarkGroup>
      </Styled.BodyRow>
      {!collapsed &&
        outcome.children.map((childUuid) => (
          <TagGroupRow
            key={childUuid}
            table={table}
            uuid={childUuid}
            readOnly={readOnly}
            toggleAssignment={toggleAssignment}
          />
        ))}
    </>
  )
}

export default OutcomeTableBody
