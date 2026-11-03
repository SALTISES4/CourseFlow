import { OutcomeTable } from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import {
  linkNodeOutcome,
  unlinkNodeOutcome
} from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { displaySystemTitle } from '@cf/i18n/systemTitles'
import { AppDispatch, RootState } from '@cf/redux/store'
import { NodeTitle } from '@cfViews/WorkflowView/GraphView/components/Section/Cell/CellNode/useNodeTitle'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { type WorkflowType } from '..'
import Checkmark, { OutcomeCheckmarkStatus } from '../Checkmark'
import * as Styled from '../styles'

const TableBody = ({
  table,
  workflowType
}: {
  table: OutcomeTable
  workflowType: WorkflowType
}) => {
  const { t } = useTranslation('workflow')
  const groups = table.entities.sections.map((group, groupIndex) => {
    const sectionDefaultTitle = t('systemLabels.sectionNumber', {
      number: (group.position ?? 0) + 1
    })
    const groupTitle = displaySystemTitle(t, group, sectionDefaultTitle)
    const groupNodes = table.groups[groupIndex].nodes.map((n) => n.uuid)
    const extraColumns = table.extraColumns[workflowType]

    return (
      <>
        <SectionHeaderRow
          index={groupIndex}
          workflowType={workflowType}
          title={groupTitle}
          table={table}
        />

        {groupNodes.map((nodeUuid, rowIndex) => {
          const node = table.entities.nodes[nodeUuid]
          const color = table.board.columns.colors[node.channelUuid ?? '']
          return (
            <Styled.BodyRow key={nodeUuid}>
              <Styled.BodyLegendWrap>
                <Styled.TableLegend color={color}>
                  <NodeTitle node={node} />
                </Styled.TableLegend>
              </Styled.BodyLegendWrap>

              <Styled.CheckmarkGroup>
                {table.tagGroups.map((group, index) => (
                  <>
                    <Styled.TagBarEmptyCell
                      className={index === 0 ? 'tag-offset' : ''}
                    />
                    <Styled.CheckmarkGroup
                      key={group.uuid}
                      className="checkmarks-group"
                    >
                      {group.outcomes.map((outcomeUuid) => (
                        <CheckmarkGroup
                          key={outcomeUuid}
                          outcomeUuid={outcomeUuid}
                          groupIndex={groupIndex}
                          rowIndex={rowIndex}
                          table={table}
                        />
                      ))}
                    </Styled.CheckmarkGroup>
                  </>
                ))}
              </Styled.CheckmarkGroup>

              {extraColumns.map((group, index) => (
                <>
                  {group.columns && (
                    <>
                      <Styled.TagBarEmptyCell />
                      <Styled.CheckmarkGroup
                        key={index}
                        className="checkmarks-group bg-light"
                      >
                        {group.columns.map((colColumn, index) => (
                          <Styled.TableCell
                            key={index}
                            className={colColumn.className}
                          >
                            {colColumn.values?.['a']}
                          </Styled.TableCell>
                        ))}
                      </Styled.CheckmarkGroup>
                    </>
                  )}
                  {group.values && (
                    <Styled.CheckmarkGroup
                      key={index}
                      className={`checkmarks-group ${group.className}`}
                      sx={{ marginLeft: 2 }}
                    >
                      <Styled.TableCell>{group.values['a']}</Styled.TableCell>
                    </Styled.CheckmarkGroup>
                  )}
                </>
              ))}
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
  groupIndex,
  rowIndex
}: {
  outcomeUuid: string
  table: OutcomeTable
  groupIndex: number
  rowIndex: number
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const expandedOutcomes = useSelector(
    (state: RootState) => state.graph.outcomeTableUi.expandedOutcomes
  )
  const outcome = table.outcomeTree.outcomes[outcomeUuid]
  const node = table.groups[groupIndex].nodes[rowIndex]
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
            groupIndex={groupIndex}
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
  table,
  workflowType
}: {
  index: number
  title: string
  table: OutcomeTable
  workflowType: WorkflowType
}) => {
  const extraColumns = table.extraColumns[workflowType]

  return (
    <Styled.BodyRow className={`section-header-row index-${index}`}>
      <Styled.BodyLegendWrap>
        <Styled.TableLegend>{title}</Styled.TableLegend>
      </Styled.BodyLegendWrap>
      {table.tagGroups.map((group, groupIndex) => (
        <Styled.CheckmarkGroup key={group.uuid}>
          <Styled.TagBarEmptyCell
            className={groupIndex === 0 ? 'tag-offset' : ''}
          />
          <Styled.CheckmarkGroup className="checkmarks-group bg-light">
            {group.outcomes.map((outcomeUuid) => (
              <OutcomeGroup
                key={outcomeUuid}
                outcomeUuid={outcomeUuid}
                groupIndex={index}
                table={table}
              />
            ))}
          </Styled.CheckmarkGroup>
        </Styled.CheckmarkGroup>
      ))}

      {extraColumns.map((group, index) => (
        <>
          {group.columns && (
            <>
              <Styled.TagBarEmptyCell />
              <Styled.CheckmarkGroup
                key={index}
                className="checkmarks-group bg-dark"
              >
                {group.columns.map((colColumn, index) => (
                  <Styled.TableCell key={index}>
                    {colColumn.values?.['a']}
                  </Styled.TableCell>
                ))}
              </Styled.CheckmarkGroup>
            </>
          )}
          {group.values && (
            <Styled.CheckmarkGroup
              key={index}
              className={`checkmarks-group ${group.className}`}
              sx={{ marginLeft: 2 }}
            >
              <Styled.TableCell>{group.values['a']}</Styled.TableCell>
            </Styled.CheckmarkGroup>
          )}
        </>
      ))}
    </Styled.BodyRow>
  )
}

const OutcomeGroup = ({
  outcomeUuid,
  groupIndex,
  table
}: {
  outcomeUuid: string
  groupIndex: number
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
        value={table.groups[groupIndex].completion[outcomeUuid] ?? 'empty'}
      />
      {!collapsed &&
        outcome.children.map((childUuid) => (
          <OutcomeGroup
            key={childUuid}
            outcomeUuid={childUuid}
            groupIndex={groupIndex}
            table={table}
          />
        ))}
    </>
  )
}

export default TableBody
