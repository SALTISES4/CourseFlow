import { nodeTitleFallback } from '@cf/components/pages/Workflow/Sidebar/components/EditTab/components/EditNode/linkedWorkflowUi'
import {
  OutcomeTable,
  selectOutcomeTable
} from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import {
  linkNodeOutcome,
  unlinkNodeOutcome
} from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { displaySystemTitle } from '@cf/i18n/systemTitles'
import { AppDispatch, RootState } from '@cf/redux/store'
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import Checkmark, { OutcomeCheckmarkStatus } from '../Checkmark'
import * as Styled from '../styles'

const TableBody = ({ graphUuid }: { graphUuid: string }) => {
  const table = useSelector((state: RootState) =>
    selectOutcomeTable(state, graphUuid)
  )

  const { t } = useTranslation('workflow')
  const groups = table.entities.sections.map((section, sectionIndex) => {
    const sectionDefaultTitle = t('systemLabels.sectionNumber', {
      number: (section.position ?? 0) + 1
    })

    const sectionTitle = displaySystemTitle(t, section, sectionDefaultTitle)
    const sectionNodes = table.sections[sectionIndex].nodes.map((n) => n.uuid)

    return (
      <>
        <SectionHeaderRow
          index={sectionIndex}
          title={sectionTitle}
          table={table}
        />

        {sectionNodes.map((nodeUuid, rowIndex) => {
          const node = table.entities.nodes[nodeUuid]
          const color = table.board.columns.colors[node.channelUuid ?? '']

          // TODO: handle title when it's coming from a linked workflow
          const displayTitle = node.linkedWorkflowUuid
            ? node.title || nodeTitleFallback(t('linked.untitledNode'))
            : displaySystemTitle(
                t,
                node,
                nodeTitleFallback(t('linked.untitledNode'))
              )

          return (
            <Styled.BodyRow key={nodeUuid}>
              <Styled.BodyLegendWrap>
                <Styled.TableLegend color={color}>
                  {node.linkedWorkflowUuid
                    ? 'workflow - ' + node.linkedWorkflowUuid
                    : displayTitle}
                </Styled.TableLegend>
              </Styled.BodyLegendWrap>

              <Styled.CheckmarkGroup>
                {table.tagGroups.map((group, index) => (
                  <>
                    <Styled.TagBarEmptyCell
                      className={index !== 0 ? 'tag-offset' : ''}
                    />
                    <Styled.CheckmarkGroup
                      key={group.uuid}
                      className="checkmarks-group"
                    >
                      {group.outcomes.map((outcomeUuid) => (
                        <CheckmarkGroup
                          key={outcomeUuid}
                          outcomeUuid={outcomeUuid}
                          sectionIndex={sectionIndex}
                          rowIndex={rowIndex}
                          table={table}
                        />
                      ))}
                    </Styled.CheckmarkGroup>
                  </>
                ))}
              </Styled.CheckmarkGroup>
            </Styled.BodyRow>
          )
        })}
      </>
    )
  })

  return <Styled.TableBody>{groups}</Styled.TableBody>
}

const CheckmarkGroup = ({
  outcomeUuid,
  table,
  sectionIndex,
  rowIndex
}: {
  outcomeUuid: string
  table: OutcomeTable
  sectionIndex: number
  rowIndex: number
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const expandedOutcomes = useSelector(
    (state: RootState) => state.graph.outcomeTableUi.expandedOutcomes
  )
  const outcome = table.outcomeTree.outcomes[outcomeUuid]
  const node = table.sections[sectionIndex].nodes[rowIndex]
  const status = node.completion[outcomeUuid] ?? 'empty'
  const collapsed = !expandedOutcomes[outcomeUuid]

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
      <Checkmark
        key={node.uuid}
        value={status}
        onClick={onCheckmarkClick(node.uuid, status)}
      />
      {!collapsed &&
        outcome.children.map((childUuid) => (
          <CheckmarkGroup
            key={childUuid}
            outcomeUuid={childUuid}
            sectionIndex={sectionIndex}
            rowIndex={rowIndex}
            table={table}
          />
        ))}
    </>
  )
}

const SectionHeaderRow = ({
  index,
  title,
  table
}: {
  index: number
  title: string
  table: OutcomeTable
}) => {
  return (
    <Styled.BodyRow className={`section-header-row index-${index}`}>
      <Styled.BodyLegendWrap>
        <Styled.TableLegend>{title}</Styled.TableLegend>
      </Styled.BodyLegendWrap>
      {table.tagGroups.map((group, groupIndex) => (
        <Styled.CheckmarkGroup key={group.uuid} className="checkmarks-group">
          <Styled.TagBarEmptyCell
            className={groupIndex !== 0 ? 'tag-offset' : ''}
          />
          {group.outcomes.map((outcomeUuid) => (
            <Styled.CheckmarkGroup key={outcomeUuid}>
              <OutcomeGroup
                outcomeUuid={outcomeUuid}
                sectionIndex={index}
                table={table}
              />
            </Styled.CheckmarkGroup>
          ))}
        </Styled.CheckmarkGroup>
      ))}
    </Styled.BodyRow>
  )
}

const OutcomeGroup = ({
  outcomeUuid,
  sectionIndex,
  table
}: {
  outcomeUuid: string
  sectionIndex: number
  table: OutcomeTable
}) => {
  const expandedOutcomes = useSelector(
    (state: RootState) => state.graph.outcomeTableUi.expandedOutcomes
  )
  const outcome = table.outcomeTree.outcomes[outcomeUuid]
  const collapsed = !expandedOutcomes[outcomeUuid]

  return (
    <>
      <Checkmark
        key={outcomeUuid}
        readOnly
        value={table.sections[sectionIndex].completion[outcomeUuid] ?? 'empty'}
        sx={{ background: '#EEF2FD' }}
      />
      {!collapsed &&
        outcome.children.map((childUuid) => (
          <OutcomeGroup
            key={childUuid}
            outcomeUuid={childUuid}
            sectionIndex={sectionIndex}
            table={table}
          />
        ))}
    </>
  )
}

export default TableBody
