import { TagListItemOut } from '@cf/api/gen'
import {
  OutcomeTable,
  selectIsOutcomeExpanded
} from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import { outcomeTableUiActions } from '@cf/features/graph/state/slices/outcomeTableUi.slice'
import { AppDispatch, RootState } from '@cf/redux/store'
import OutcomeHeader from '@cfPages/Workflow/Sidebar/components/OutcomesTab/Outcome/Header'
import useOutcomeTitle from '@cfViews/WorkflowView/OutcomeEditView/useOutcomeTitle'
import { Fragment, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { type ProjectTagsMap, type WorkflowType } from '..'
import * as Styled from '../styles'

const TableHeader = ({
  table,
  workflowType,
  projectTagsMap
}: {
  table: OutcomeTable
  workflowType: WorkflowType
  projectTagsMap: ProjectTagsMap
}) => {
  const { t } = useTranslation('workflow')
  const extraColumns = table.extraColumns[workflowType]

  return (
    <Styled.TableHeader>
      <Styled.HeaderLegendWrap />
      {table.tagGroups.map((group, index) => {
        const found = projectTagsMap[group.uuid]
        const groupTitle = found ? found.label : group.title

        return (
          <Fragment key={group.uuid}>
            {groupTitle && (
              <Styled.HeaderLegendWrap
                tagLabel
                className={index === 0 ? 'tag-offset' : ''}
              >
                <Styled.TableLegend>{t(groupTitle as any)}</Styled.TableLegend>
              </Styled.HeaderLegendWrap>
            )}
            {group.outcomes.map((outcomeUuid) => (
              <TableHeaderOutcome
                key={outcomeUuid}
                table={table}
                projectTagsMap={projectTagsMap}
                uuid={outcomeUuid}
              />
            ))}
          </Fragment>
        )
      })}

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
                    data-test-id={column.headerTestId}
                  >
                    {t(column.labelKey)}
                  </Styled.TableLegend>
                </Styled.HeaderLegendWrap>
              ))}
            </>
          ) : (
            <Styled.HeaderLegendWrap sx={{ marginLeft: 2 }}>
              <Styled.TableLegend
                className={`legend-extra ${group.className}`}
                data-test-id={group.headerTestId}
              >
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
  uuid,
  projectTagsMap
}: {
  table: OutcomeTable
  uuid: string
  projectTagsMap: ProjectTagsMap
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const outcome = table.outcomeTree.outcomes[uuid]
  const expanded = useSelector((state: RootState) =>
    selectIsOutcomeExpanded(state, outcome.uuid)
  )

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
            collapsed={!expanded}
            showToggle={!!outcome.children.length}
            setCollapsed={() => {}} // this should be nuked really
            onToggleClick={onOutcomeToggleClick}
          />
        </Styled.TableLegend>
      </Styled.HeaderLegendWrap>
      {expanded &&
        outcome.children.map((childUuid) => (
          <TableHeaderOutcome
            key={childUuid}
            table={table}
            uuid={childUuid}
            projectTagsMap={projectTagsMap}
          />
        ))}
    </>
  )
}

export default TableHeader
