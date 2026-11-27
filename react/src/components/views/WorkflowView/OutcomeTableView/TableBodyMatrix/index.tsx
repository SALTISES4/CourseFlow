import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
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
import {
  formatDurationHoursNumber,
  formatWholeHoursNumber
} from '@cfComponents/duration'
import {
  NodeTitle,
  useNodeTitle
} from '@cfViews/WorkflowView/GraphView/components/Section/Cell/CellNode/useNodeTitle'
import useOutcomeTitle from '@cfViews/WorkflowView/OutcomeEditView/useOutcomeTitle'
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
  const { t, i18n } = useTranslation('workflow')
  const canAssignOutcomes = useResourcePermission(
    WorkflowPermission.ASSIGN_OUTCOMES
  )
  const groups = table.entities.sections.map((section, sectionIndex) => {
    const sectionDefaultTitle = t('systemLabels.sectionNumber', {
      number: (section.position ?? 0) + 1
    })
    const sectionTitle = displaySystemTitle(t, section, sectionDefaultTitle)
    const sectionNodes = table.groups[sectionIndex].nodes.map((n) => n.uuid)
    const extraColumns = table.extraColumns[workflowType]

    return (
      <Styled.SemanticGroup
        key={section.uuid}
        role="rowgroup"
        aria-label={sectionTitle}
      >
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
            <Styled.BodyRow key={nodeUuid} role="row">
              <Styled.BodyLegendWrap>
                <Styled.TableLegend color={color} role="rowheader" tabIndex={0}>
                  <NodeTitle node={node} />
                </Styled.TableLegend>
              </Styled.BodyLegendWrap>

              <Styled.CheckmarkGroup>
                {table.tagGroups.map((group, index) => (
                  <>
                    {group.title && (
                      <Styled.TagBarEmptyCell
                        className={index === 0 ? 'tag-offset' : ''}
                      />
                    )}
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
                          readOnly={!canAssignOutcomes}
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
                          data-test-id={column.nodeTestId}
                          role="gridcell"
                        >
                          {renderExtraColumnValue(
                            column.values[nodeUuid],
                            column.format,
                            i18n.language
                          )}
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
                    <Styled.TableCell
                      data-test-id={group.nodeTestId}
                      role="gridcell"
                    >
                      {renderExtraColumnValue(
                        group.values[nodeUuid],
                        group.format,
                        i18n.language
                      )}
                    </Styled.TableCell>
                  </Styled.CheckmarkGroup>
                )
              )}
            </Styled.BodyRow>
          )
        })}
      </Styled.SemanticGroup>
    )
  })

  return (
    <Styled.TableBody>
      {groups}
      <GrandTotalRow table={table} workflowType={workflowType} />
    </Styled.TableBody>
  )
}

const CheckmarkGroup = ({
  outcomeUuid,
  table,
  groupIndex,
  rowIndex,
  readOnly
}: {
  outcomeUuid: string
  table: OutcomeTable
  groupIndex: number
  rowIndex: number
  readOnly: boolean
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const { t } = useTranslation('workflow')
  const outcome = table.outcomeTree.outcomes[outcomeUuid]
  const node = table.groups[groupIndex].nodes[rowIndex]
  const nodeTitle = useNodeTitle(table.entities.nodes[node.uuid])
  const outcomeTitle = useOutcomeTitle({
    title: outcome.title,
    titleCopyCount: outcome.titleCopyCount
  })
  const outcomeDisplayTitle = `${outcome.prefix} ${outcomeTitle}`
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
        label={t('outcomeTable.assignmentCellLabel', {
          outcome: outcomeDisplayTitle,
          node: nodeTitle
        })}
        readOnly={readOnly}
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
            readOnly={readOnly}
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
  const { i18n } = useTranslation('workflow')
  const extraColumns = table.extraColumns[workflowType]

  return (
    <Styled.BodyRow className="section-header-row" role="row">
      <Styled.BodyLegendWrap>
        <Styled.TableLegend role="rowheader">{title}</Styled.TableLegend>
      </Styled.BodyLegendWrap>
      {table.tagGroups.map((group, groupIndex) => (
        <Styled.CheckmarkGroup key={group.uuid}>
          {group.title && (
            <Styled.TagBarEmptyCell
              className={groupIndex === 0 ? 'tag-offset' : ''}
            />
          )}
          <Styled.CheckmarkGroup className="checkmarks-group bg-light">
            {group.outcomes.map((outcomeUuid) => (
              <OutcomeGroup
                key={outcomeUuid}
                outcomeUuid={outcomeUuid}
                groupIndex={index}
                table={table}
                sectionTitle={title}
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
                <Styled.TableCell
                  key={column.labelKey}
                  data-test-id={column.sectionTestId}
                  role="gridcell"
                >
                  {renderExtraColumnValue(
                    column.values[uuid],
                    column.format,
                    i18n.language
                  )}
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
            <Styled.TableCell
              data-test-id={group.sectionTestId}
              role="gridcell"
            >
              {renderExtraColumnValue(
                group.values[uuid],
                group.format,
                i18n.language
              )}
            </Styled.TableCell>
          </Styled.CheckmarkGroup>
        )
      )}
    </Styled.BodyRow>
  )
}

const GrandTotalRow = ({
  table,
  workflowType
}: {
  table: OutcomeTable
  workflowType: WorkflowType
}) => {
  const { t, i18n } = useTranslation('workflow')
  const extraColumns = table.extraColumns[workflowType]
  const nodeUuids = Object.keys(table.entities.nodes)

  return (
    <Styled.BodyRow
      className="section-header-row"
      data-test-id="workflow-outcome-table-grand-total-row"
      role="row"
    >
      <Styled.BodyLegendWrap>
        <Styled.TableLegend sx={{ background: '#E5E9F4' }}>
          {t('outcomeTable.grandTotal')}
        </Styled.TableLegend>
      </Styled.BodyLegendWrap>
      {table.tagGroups.map((group, groupIndex) => (
        <Styled.CheckmarkGroup key={group.uuid}>
          {group.title && (
            <Styled.TagBarEmptyCell
              className={groupIndex === 0 ? 'tag-offset' : ''}
            />
          )}
          <Styled.CheckmarkGroup className="checkmarks-group bg-dark">
            {group.outcomes.map((outcomeUuid) => (
              <GrandTotalEmptyCellGroup
                key={outcomeUuid}
                outcomeUuid={outcomeUuid}
                groupIndex={groupIndex}
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
                <Styled.TableCell
                  key={column.labelKey}
                  data-test-id={column.grandTotal?.testId}
                  role="gridcell"
                >
                  {column.grandTotal?.include
                    ? renderExtraColumnValue(
                        sumGrandTotalValues(column.values, nodeUuids),
                        column.format,
                        i18n.language
                      )
                    : null}
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
            <Styled.TableCell
              data-test-id={group.grandTotal?.testId}
              role="gridcell"
            >
              {group.grandTotal?.include
                ? renderExtraColumnValue(
                    sumGrandTotalValues(group.values, nodeUuids),
                    group.format,
                    i18n.language
                  )
                : null}
            </Styled.TableCell>
            <Styled.TableCell data-test-id={group.sectionTestId}>
              {renderExtraColumnValue(
                table.entities.sections.reduce((acc, section) => {
                  const val = group.values[section.uuid] ?? 0
                  return acc + val
                }, 0),
                group.format,
                i18n.language
              )}
            </Styled.TableCell>
          </Styled.CheckmarkGroup>
        )
      )}
    </Styled.BodyRow>
  )
}

const GrandTotalEmptyCellGroup = ({
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
      <Styled.TableCell data-test-id="workflow-outcome-table-grand-total-outcome-cell" />
      {expanded &&
        outcome.children.map((childUuid) => (
          <GrandTotalEmptyCellGroup
            key={childUuid}
            outcomeUuid={childUuid}
            groupIndex={groupIndex}
            table={table}
          />
        ))}
    </>
  )
}

function sumGrandTotalValues(
  values: Record<string, number | null | undefined>,
  nodeUuids: string[]
): number | null | undefined {
  const applicableValues = nodeUuids
    .map((uuid) => values[uuid])
    .filter((value) => value !== undefined)

  if (applicableValues.length === 0) {
    return undefined
  }

  const enteredValues = applicableValues.filter(
    (value): value is number => value !== null
  )
  if (enteredValues.length === 0) {
    return null
  }

  return enteredValues.reduce((total, value) => total + value, 0)
}

function renderExtraColumnValue(
  value: number | null | undefined,
  format: 'durationHours' | 'wholeHours' | undefined,
  locale: string
) {
  if (value === undefined) {
    return null
  }
  if (value === null) {
    return '—'
  }
  if (format === 'durationHours') {
    return formatDurationHoursNumber(value, locale)
  }
  if (format === 'wholeHours') {
    return formatWholeHoursNumber(value, locale)
  }
  return value
}

const OutcomeGroup = ({
  outcomeUuid,
  groupIndex,
  table,
  sectionTitle
}: {
  outcomeUuid: string
  groupIndex: number
  table: OutcomeTable
  sectionTitle: string
}) => {
  const { t } = useTranslation('workflow')
  const outcome = table.outcomeTree.outcomes[outcomeUuid]
  const outcomeTitle = useOutcomeTitle({
    title: outcome.title,
    titleCopyCount: outcome.titleCopyCount
  })
  const outcomeDisplayTitle = `${outcome.prefix} ${outcomeTitle}`
  const expanded = useSelector((state: RootState) =>
    selectIsOutcomeExpanded(state, outcome.uuid)
  )

  return (
    <>
      <Checkmark
        key={outcomeUuid}
        readOnly
        label={t('outcomeTable.sectionRollupCellLabel', {
          outcome: outcomeDisplayTitle,
          section: sectionTitle
        })}
        value={table.groups[groupIndex].completion[outcomeUuid] ?? 'empty'}
      />
      {expanded &&
        outcome.children.map((childUuid) => (
          <OutcomeGroup
            key={childUuid}
            outcomeUuid={childUuid}
            groupIndex={groupIndex}
            table={table}
            sectionTitle={sectionTitle}
          />
        ))}
    </>
  )
}

export default TableBody
