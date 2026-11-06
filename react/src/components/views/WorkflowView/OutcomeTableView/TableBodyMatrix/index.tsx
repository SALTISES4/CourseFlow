import {
  OutcomeTable,
  selectIsOutcomeExpanded
} from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import {
  linkNodeOutcome,
  unlinkNodeOutcome
} from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { displaySystemTitle } from '@cf/i18n/systemTitles'
import { AppDispatch, RootState } from '@cf/redux/store'
import { NodeTitle } from '@cfViews/WorkflowView/GraphView/components/Section/Cell/CellNode/useNodeTitle'
import { Fragment } from 'react'
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
  const groups = table.entities.sections.map((section, sectionIndex) => {
    const sectionDefaultTitle = t('systemLabels.sectionNumber', {
      number: (section.position ?? 0) + 1
    })
    const sectionTitle = displaySystemTitle(t, section, sectionDefaultTitle)
    const sectionNodes = table.groups[sectionIndex].nodes.map((n) => n.uuid)
    const extraColumns = table.extraColumns[workflowType]

    return (
      <>
        <SectionHeaderRow
          uuid={section.uuid}
          index={sectionIndex}
          workflowType={workflowType}
          title={sectionTitle}
          table={table}
        />

        {sectionNodes.map((nodeUuid, rowIndex) => {
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
                          groupIndex={sectionIndex}
                          rowIndex={rowIndex}
                          table={table}
                        />
                      ))}
                    </Styled.CheckmarkGroup>
                  </>
                ))}
              </Styled.CheckmarkGroup>

              {extraColumns.map((group) =>
                'columns' in group ? (
                  <Fragment key={group.labelKey}>
                    <Styled.TagBarEmptyCell />
                    <Styled.CheckmarkGroup className="checkmarks-group bg-light">
                      {group.columns.map((column) => (
                        <Styled.TableCell
                          key={column.labelKey}
                          className={column.className}
                        >
                          {column.values[nodeUuid]}
                        </Styled.TableCell>
                      ))}
                    </Styled.CheckmarkGroup>
                  </Fragment>
                ) : (
                  <Styled.CheckmarkGroup
                    key={group.labelKey}
                    className={`checkmarks-group ${group.className}`}
                    sx={{ marginLeft: 2 }}
                  >
                    <Styled.TableCell>
                      {group.values[nodeUuid]}
                    </Styled.TableCell>
                  </Styled.CheckmarkGroup>
                )
              )}
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
  const outcome = table.outcomeTree.outcomes[outcomeUuid]
  const node = table.groups[groupIndex].nodes[rowIndex]
  const status = node.completion[outcomeUuid] ?? 'empty'
  const expanded = useSelector((state: RootState) =>
    selectIsOutcomeExpanded(state, outcome.uuid)
  )

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
      {expanded &&
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
  uuid,
  index,
  title,
  table,
  workflowType
}: {
  uuid: string
  index: number
  title: string
  table: OutcomeTable
  workflowType: WorkflowType
}) => {
  const extraColumns = table.extraColumns[workflowType]

  return (
    <Styled.BodyRow className="section-header-row">
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

      {extraColumns.map((group) =>
        'columns' in group ? (
          <Fragment key={group.labelKey}>
            <Styled.TagBarEmptyCell />
            <Styled.CheckmarkGroup className="checkmarks-group bg-dark">
              {group.columns.map((column) => (
                <Styled.TableCell key={column.labelKey}>
                  {column.values[uuid]}
                </Styled.TableCell>
              ))}
            </Styled.CheckmarkGroup>
          </Fragment>
        ) : (
          <Styled.CheckmarkGroup
            key={group.labelKey}
            className={`checkmarks-group ${group.className}`}
            sx={{ marginLeft: 2 }}
          >
            <Styled.TableCell>{group.values[uuid]}</Styled.TableCell>
          </Styled.CheckmarkGroup>
        )
      )}
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
  const outcome = table.outcomeTree.outcomes[outcomeUuid]
  const expanded = useSelector((state: RootState) =>
    selectIsOutcomeExpanded(state, outcome.uuid)
  )

  return (
    <>
      <Checkmark
        key={outcomeUuid}
        readOnly
        value={table.groups[groupIndex].completion[outcomeUuid] ?? 'empty'}
      />
      {expanded &&
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
