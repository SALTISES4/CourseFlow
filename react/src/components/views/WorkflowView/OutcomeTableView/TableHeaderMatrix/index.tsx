import {
  OutcomeTable,
  selectOutcomeTable
} from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import { outcomeTableUiActions } from '@cf/features/graph/state/slices/outcomeTableUi.slice'
import { AppDispatch, RootState } from '@cf/redux/store'
import OutcomeHeader from '@cfPages/Workflow/Sidebar/components/OutcomesTab/Outcome/Header'
import { Fragment, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Styled from '../styles'

const TableHeader = ({ graphUuid }: { graphUuid: string }) => {
  const table = useSelector((state: RootState) =>
    selectOutcomeTable(state, graphUuid)
  )
  const workflowType = 'program' // TODO: grab this from RTK
  const extraColumns = table.extraColumns[workflowType]

  return (
    <Styled.TableHeader>
      <Styled.HeaderLegendWrap />
      {table.tagGroups.map((group, index) => (
        <Fragment key={group.uuid}>
          <Styled.HeaderLegendWrap
            tagLabel
            className={index !== 0 ? 'tag-offset' : ''}
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

      {extraColumns.map((group, index) => (
        <Fragment key={index}>
          {group.columns ? (
            <>
              <Styled.HeaderLegendWrap tagLabel className="tag-offset">
                <Styled.TableLegend>{group.label}</Styled.TableLegend>
              </Styled.HeaderLegendWrap>
              {group.columns.map((column, colIndex) => (
                <Styled.HeaderLegendWrap key={colIndex}>
                  <Styled.TableLegend
                    className={column.className}
                    sx={{ border: 0, left: '8px !important' }}
                  >
                    {column.label}
                  </Styled.TableLegend>
                </Styled.HeaderLegendWrap>
              ))}
            </>
          ) : (
            <Styled.HeaderLegendWrap sx={{ marginLeft: 2 }}>
              <Styled.TableLegend
                className={group.className}
                sx={{ border: 0, left: '8px !important' }}
              >
                {group.label}
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
            title={outcome.title}
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
