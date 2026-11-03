import { OutcomeTable } from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import { outcomeTableUiActions } from '@cf/features/graph/state/slices/outcomeTableUi.slice'
import {
  linkNodeOutcome,
  unlinkNodeOutcome
} from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { AppDispatch, RootState } from '@cf/redux/store'
import OutcomeHeader from '@cfPages/Workflow/Sidebar/components/OutcomesTab/Outcome/Header'
import useOutcomeTitle from '@cfViews/WorkflowView/OutcomeEditView/useOutcomeTitle'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Checkmark, { OutcomeCheckmarkStatus } from '../Checkmark'
import * as Styled from '../styles'

const TableBody = ({ table }: { table: OutcomeTable }) => {
  return (
    <Styled.TableBody>
      {table.tagGroups.map((group) => (
        <Styled.TagGroup key={group.uuid}>
          <Styled.BodyRow className="tag-header-row">
            <Styled.BodyLegendWrap>
              <Styled.TableLegend>
                {group.title || 'Untagged outcomes'}
              </Styled.TableLegend>
            </Styled.BodyLegendWrap>
            <Styled.BodyLegendWrap />
          </Styled.BodyRow>

          {group.outcomes.map((outcomeUuid) => (
            <TagGroupRow key={outcomeUuid} table={table} uuid={outcomeUuid} />
          ))}
        </Styled.TagGroup>
      ))}
    </Styled.TableBody>
  )
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

  const outcomeTitle = useOutcomeTitle({
    title: outcome.title,
    titleCopyCount: outcome.titleCopyCount
  })

  const onOutcomeToggleClick = useCallback(() => {
    dispatch(outcomeTableUiActions.outcomeExpand({ uuid: uuid }))
  }, [dispatch, uuid])

  const onCheckmarkClick = (
    nodeUuid: string,
    status: OutcomeCheckmarkStatus
  ) => {
    return () => {
      // if the existing status is full, we're unlinking this and the children outcomes
      // otherwise, partial or empty will trigger the linking
      const action = status === 'full' ? 'unlink' : 'link'

      const params = {
        graphUuid: table.board.uuid,
        nodeUuid,
        outcomeUuid: outcome.uuid
      }

      dispatch(
        action === 'link' ? linkNodeOutcome(params) : unlinkNodeOutcome(params)
      )
    }
  }

  return (
    <>
      <Styled.BodyRow>
        <Styled.BodyLegendWrap>
          <OutcomeHeader
            uuid={uuid}
            level={outcome.level}
            title={`${outcome.prefix} ${outcomeTitle}`}
            tooltip={outcome.tooltipTitle}
            collapsed={collapsed}
            showToggle={!!outcome.children.length}
            setCollapsed={() => {}} // this should be nuked really
            onToggleClick={onOutcomeToggleClick}
          />
        </Styled.BodyLegendWrap>

        <Styled.CheckmarkGroup className="checkmarks-group">
          {table.groups.map((group) => (
            <Styled.CheckmarkGroup key={group.uuid}>
              <Checkmark
                readOnly
                sx={{ background: '#eef2fd' }}
                value={group.completion[outcome.uuid] ?? 'empty'}
              />
              {group.nodes.map((node) => {
                const status = node.completion[outcome.uuid] ?? 'empty'
                return (
                  <Checkmark
                    key={node.uuid}
                    value={status}
                    onClick={onCheckmarkClick(node.uuid, status)}
                  />
                )
              })}
            </Styled.CheckmarkGroup>
          ))}
        </Styled.CheckmarkGroup>
      </Styled.BodyRow>
      {!collapsed &&
        outcome.children.map((childUuid) => (
          <TagGroupRow key={childUuid} table={table} uuid={childUuid} />
        ))}
    </>
  )
}

export default TableBody
