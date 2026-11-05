import { OutcomeTable } from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import { outcomeTableUiActions } from '@cf/features/graph/state/slices/outcomeTableUi.slice'
import { AppDispatch, RootState } from '@cf/redux/store'
import OutcomeHeader from '@cfPages/Workflow/Sidebar/components/OutcomesTab/Outcome/Header'
import useOutcomeTitle from '@cfViews/WorkflowView/OutcomeEditView/useOutcomeTitle'
import { Fragment, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { type WorkflowType } from '..'
import * as Styled from '../styles'

const TableHeader = ({
  table,
  workflowType
}: {
  table: OutcomeTable
  workflowType: WorkflowType
}) => {
  const { t } = useTranslation('workflow')
  const extraColumns = table.extraColumns[workflowType]

  return (
    <Styled.TableHeader>
      <Styled.HeaderLegendWrap />
      {table.tagGroups.map((group, index) => (
        <Fragment key={group.uuid}>
          <Styled.HeaderLegendWrap
            tagLabel
            className={index === 0 ? 'tag-offset' : ''}
          >
            <Styled.TableLegend>
              {group.title || 'Untagged outcomes'}
            </Styled.TableLegend>
          </Styled.HeaderLegendWrap>
          {group.outcomes.map((outcomeUuid) => (
            <TableHeaderOutcome
              key={outcomeUuid}
              table={table}
              uuid={outcomeUuid}
            />
          ))}
        </Fragment>
      ))}

      {extraColumns.map((group) => (
        <Fragment key={group.labelKey}>
          {'columns' in group ? (
            <>
              <Styled.HeaderLegendWrap tagLabel>
                <Styled.TableLegend>{t(group.labelKey)}</Styled.TableLegend>
              </Styled.HeaderLegendWrap>
              {group.columns.map((column) => (
                <Styled.HeaderLegendWrap key={column.labelKey}>
                  <Styled.TableLegend
                    className={`legend-extra ${column.className}`}
                  >
                    {t(column.labelKey)}
                  </Styled.TableLegend>
                </Styled.HeaderLegendWrap>
              ))}
            </>
          ) : (
            <Styled.HeaderLegendWrap sx={{ marginLeft: 2 }}>
              <Styled.TableLegend className={`legend-extra ${group.className}`}>
                {t(group.labelKey)}
              </Styled.TableLegend>
            </Styled.HeaderLegendWrap>
          )}
        </Fragment>
      ))}
    </Styled.TableHeader>
  )
}

const TableHeaderOutcome = ({
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

  const outcomeTitle = useOutcomeTitle({
    title: outcome.title,
    titleCopyCount: outcome.titleCopyCount
  })

  const onOutcomeToggleClick = useCallback(() => {
    dispatch(outcomeTableUiActions.outcomeExpand({ uuid: uuid }))
  }, [dispatch, uuid])

  return (
    <>
      <Styled.HeaderLegendWrap>
        <Styled.TableLegend sx={{ background: 'transparent', padding: 0 }}>
          <OutcomeHeader
            uuid={uuid}
            level={outcome.level}
            title={`${outcome.prefix} ${outcomeTitle}`}
            collapsed={collapsed}
            showToggle={!!outcome.children.length}
            setCollapsed={() => {}} // this should be nuked really
            onToggleClick={onOutcomeToggleClick}
          />
        </Styled.TableLegend>
      </Styled.HeaderLegendWrap>
      {!collapsed &&
        outcome.children.map((childUuid) => (
          <TableHeaderOutcome key={childUuid} table={table} uuid={childUuid} />
        ))}
    </>
  )
}

export default TableHeader
