import { WorkflowType } from '@cf/api/gen/types.gen'
import { nodeTitleFallback } from '@cf/components/pages/Workflow/Sidebar/components/EditTab/components/EditNode/linkedWorkflowUi'
import { OutcomeTable } from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import { outcomeTableUiActions } from '@cf/features/graph/state/slices/outcomeTableUi.slice'
import { displaySystemTitle } from '@cf/i18n/systemTitles'
import { AppDispatch, RootState } from '@cf/redux/store'
import OutcomeHeader from '@cfPages/Workflow/Sidebar/components/OutcomesTab/Outcome/Header'
import Tooltip from '@mui/material/Tooltip'
import { Fragment, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import * as Styled from '../styles'

type PropsType = {
  viewType: 'normal' | 'matrix'
  table: OutcomeTable
  workflowType: WorkflowType
}

const OutcomeTableHeader = ({ viewType, table, workflowType }: PropsType) => (
  <Styled.TableHeader role="row">
    <Styled.HeaderLegendWrap aria-hidden />
    {viewType === 'normal' ? (
      <SectionGroups table={table} />
    ) : (
      <>
        <TagGroups table={table} />
        <SummaryColumns workflowType={workflowType} />
      </>
    )}
  </Styled.TableHeader>
)

const SummaryHeaderCell = ({
  label,
  testId
}: {
  label: string
  testId: string
}) => (
  <Styled.SummaryHeaderCell
    role="columnheader"
    aria-label={label}
    tabIndex={0}
    data-test-id={testId}
  >
    <Styled.TableLegend title={label}>{label}</Styled.TableLegend>
  </Styled.SummaryHeaderCell>
)

const SummaryColumns = ({ workflowType }: { workflowType: WorkflowType }) => {
  const { t } = useTranslation('workflow')
  if (workflowType === WorkflowType.COURSE) {
    return (
      <Styled.SummaryHeaders>
        <Styled.SummaryHeaderGroup>
          <SummaryHeaderCell
            label={t('outcomeTable.summary.totalHours')}
            testId="workflow-outcome-table-total-hours-column"
          />
        </Styled.SummaryHeaderGroup>
      </Styled.SummaryHeaders>
    )
  }

  return (
    <Styled.SummaryHeaders>
      <Styled.SummaryHeaderGroup
        role="group"
        aria-label={t('outcomeTable.summary.classification')}
        data-test-id="workflow-outcome-table-classification-group"
      >
        <Styled.SummaryGroupTitle>
          {t('outcomeTable.summary.classification')}
        </Styled.SummaryGroupTitle>
        <SummaryHeaderCell
          label={t('outcomeTable.summary.generalEducation')}
          testId="workflow-outcome-table-general-education-column"
        />
        <SummaryHeaderCell
          label={t('outcomeTable.summary.specificEducation')}
          testId="workflow-outcome-table-specific-education-column"
        />
      </Styled.SummaryHeaderGroup>
      <Styled.SummaryHeaderGroup
        role="group"
        aria-label={t('outcomeTable.summary.ponderation')}
        data-test-id="workflow-outcome-table-ponderation-group"
      >
        <Styled.SummaryGroupTitle>
          {t('outcomeTable.summary.ponderation')}
        </Styled.SummaryGroupTitle>
        <SummaryHeaderCell
          label={t('outcomeTable.summary.theory')}
          testId="workflow-outcome-table-theory-column"
        />
        <SummaryHeaderCell
          label={t('outcomeTable.summary.practical')}
          testId="workflow-outcome-table-practical-column"
        />
        <SummaryHeaderCell
          label={t('outcomeTable.summary.individualWork')}
          testId="workflow-outcome-table-individual-column"
        />
        <SummaryHeaderCell
          label={t('outcomeTable.summary.totalHours')}
          testId="workflow-outcome-table-ponderation-total-column"
        />
      </Styled.SummaryHeaderGroup>
      <Styled.SummaryHeaderGroup>
        <SummaryHeaderCell
          label={t('outcomeTable.summary.credits')}
          testId="workflow-outcome-table-credits-column"
        />
      </Styled.SummaryHeaderGroup>
    </Styled.SummaryHeaders>
  )
}

const SectionGroups = ({ table }: { table: OutcomeTable }) => {
  const { t } = useTranslation('workflow')

  return table.entities.sections.map((section, index) => {
    const sectionDefaultTitle = t('systemLabels.sectionNumber', {
      number: (section.position ?? 0) + 1
    })
    const sectionTitle = displaySystemTitle(t, section, sectionDefaultTitle)
    const sectionNodes = table.sections[index].nodes.map((node) => node.uuid)

    return (
      <Fragment key={section.uuid}>
        <Styled.HeaderLegendWrap role="group" aria-label={sectionTitle}>
          <Styled.TableLegend title={sectionTitle}>
            {sectionTitle}
          </Styled.TableLegend>
        </Styled.HeaderLegendWrap>
        {sectionNodes.map((nodeUuid) => {
          const node = table.entities.nodes[nodeUuid]
          const color = table.board.columns.colors[node.channelUuid ?? '']
          const displayTitle = node.linkedWorkflowUuid
            ? node.title || nodeTitleFallback(t('linked.untitledNode'))
            : displaySystemTitle(
                t,
                node,
                nodeTitleFallback(t('linked.untitledNode'))
              )

          return (
            <Styled.HeaderLegendWrap
              key={nodeUuid}
              role="columnheader"
              aria-label={displayTitle}
              tabIndex={0}
            >
              <Tooltip
                placement="top"
                arrow
                disableInteractive
                title={displayTitle}
              >
                <Styled.TableLegend color={color}>
                  {displayTitle}
                </Styled.TableLegend>
              </Tooltip>
            </Styled.HeaderLegendWrap>
          )
        })}
      </Fragment>
    )
  })
}

const TagGroups = ({ table }: { table: OutcomeTable }) => {
  const { t } = useTranslation('workflow')
  const hasTaggedGroups = table.tagGroups.some((group) => group.uuid !== -1)

  return table.tagGroups.map((group) => {
    const groupTitle =
      group.title ||
      (hasTaggedGroups ? t('outcomes.untagged') : t('outcomes.title'))
    return (
      <Fragment key={group.uuid}>
        <Styled.HeaderLegendWrap role="group" aria-label={groupTitle}>
          <Styled.TableLegend title={groupTitle}>
            {group.title || (hasTaggedGroups ? t('outcomes.untagged') : '')}
          </Styled.TableLegend>
        </Styled.HeaderLegendWrap>
        {group.outcomes.map((outcomeUuid) => (
          <TagGroupRow key={outcomeUuid} table={table} uuid={outcomeUuid} />
        ))}
      </Fragment>
    )
  })
}

const TagGroupRow = ({
  table,
  uuid
}: {
  table: OutcomeTable
  uuid: string
}) => {
  const dispatch = useDispatch<AppDispatch>()
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
      <Styled.HeaderLegendWrap
        role="columnheader"
        aria-label={outcome.title}
        tabIndex={0}
      >
        <Styled.TableLegend
          title={outcome.title}
          sx={{ background: 'transparent', padding: 0 }}
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
        </Styled.TableLegend>
      </Styled.HeaderLegendWrap>
      {!collapsed &&
        outcome.children.map((childUuid) => (
          <TagGroupRow key={childUuid} table={table} uuid={childUuid} />
        ))}
    </>
  )
}

export default OutcomeTableHeader
