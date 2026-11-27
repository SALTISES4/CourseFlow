import { isApiErrorNotificationHandled } from '@cf/api/apiError'
import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import {
  OutcomeTable,
  selectIsOutcomeExpanded
} from '@cf/features/graph/state/selectors/outcomeTable.selectors'
import { outcomeTableUiActions } from '@cf/features/graph/state/slices/outcomeTableUi.slice'
import {
  linkNodeOutcome,
  unlinkNodeOutcome
} from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { displaySystemTitle } from '@cf/i18n/systemTitles'
import { AppDispatch, RootState } from '@cf/redux/store'
import OutcomeHeader from '@cfPages/Workflow/Sidebar/components/OutcomesTab/Outcome/Header'
import useNodeTitle from '@cfViews/WorkflowView/GraphView/components/Section/Cell/CellNode/useNodeTitle'
import useOutcomeTitle from '@cfViews/WorkflowView/OutcomeEditView/useOutcomeTitle'
import { enqueueSnackbar } from 'notistack'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { type ProjectTagsMap } from '..'
import Checkmark, { OutcomeCheckmarkStatus } from '../Checkmark'
import {
  affectedOutcomeUuids,
  useOutcomeAssignmentPending
} from '../outcomeAssignment'
import * as Styled from '../styles'

const TableBody = ({
  table,
  projectTagsMap
}: {
  table: OutcomeTable
  projectTagsMap: ProjectTagsMap
}) => {
  const { t } = useTranslation('workflow')
  const canAssignOutcomes = useResourcePermission(
    WorkflowPermission.ASSIGN_OUTCOMES
  )
  return (
    <Styled.TableBody>
      {table.tagGroups.map((group) => {
        const found = projectTagsMap[group.uuid]
        const groupTitle =
          group.uuid === -1
            ? table.tagGroups.length > 1
              ? t('outcomes.untagged')
              : ''
            : (found?.label ?? group.title)

        return (
          <Styled.TagGroup
            key={group.uuid}
            role="rowgroup"
            aria-label={groupTitle || t('outcomes.title')}
            data-test-id="workflow-outcome-table-tag-group"
          >
            {groupTitle && (
              <Styled.BodyRow className="tag-header-row" role="row">
                <Styled.BodyLegendWrap>
                  <Styled.TableLegend>{groupTitle}</Styled.TableLegend>
                </Styled.BodyLegendWrap>
                <Styled.BodyLegendWrap />
              </Styled.BodyRow>
            )}

            {group.outcomes.map((outcomeUuid) => (
              <TagGroupRow
                key={outcomeUuid}
                table={table}
                uuid={outcomeUuid}
                readOnly={!canAssignOutcomes}
              />
            ))}
          </Styled.TagGroup>
        )
      })}
    </Styled.TableBody>
  )
}

const TagGroupRow = ({
  table,
  uuid,
  readOnly
}: {
  table: OutcomeTable
  uuid: string
  readOnly: boolean
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const { t } = useTranslation('workflow')
  const outcome = table.outcomeTree.outcomes[uuid]
  const expanded = useSelector((state: RootState) =>
    selectIsOutcomeExpanded(state, outcome.uuid)
  )

  const outcomeTitle = useOutcomeTitle({
    title: outcome.title,
    titleCopyCount: outcome.titleCopyCount
  })
  const outcomeDisplayTitle = `${outcome.prefix} ${outcomeTitle}`

  const onOutcomeToggleClick = useCallback(() => {
    dispatch(outcomeTableUiActions.outcomeExpand({ uuid: uuid }))
  }, [dispatch, uuid])

  return (
    <>
      <Styled.BodyRow role="row">
        <Styled.BodyLegendWrap
          role="rowheader"
          aria-label={outcomeDisplayTitle}
          tabIndex={0}
        >
          <OutcomeHeader
            uuid={uuid}
            level={outcome.level}
            title={outcomeDisplayTitle}
            tooltip={outcome.tooltipTitle}
            collapsed={!expanded}
            showToggle={!!outcome.children.length}
            setCollapsed={() => {}} // this should be nuked really
            onToggleClick={onOutcomeToggleClick}
          />
        </Styled.BodyLegendWrap>

        <Styled.CheckmarkGroup className="checkmarks-group">
          {table.groups.map((group, groupIndex) => {
            const section = table.entities.sections[groupIndex]
            const sectionTitle = displaySystemTitle(
              t,
              section,
              t('systemLabels.sectionNumber', {
                number: (section?.position ?? 0) + 1
              })
            )
            return (
              <Styled.CheckmarkGroup key={group.uuid}>
                <Checkmark
                  readOnly
                  label={t('outcomeTable.sectionRollupCellLabel', {
                    outcome: outcomeDisplayTitle,
                    section: sectionTitle
                  })}
                  sx={{ backgroundColor: '#eef2fd' }}
                  value={group.completion[outcome.uuid] ?? 'empty'}
                />
                {group.nodes.map((node) => (
                  <NodeCheckmark
                    key={node.uuid}
                    table={table}
                    nodeUuid={node.uuid}
                    outcomeUuid={outcome.uuid}
                    outcomeTitle={outcomeDisplayTitle}
                    status={node.completion[outcome.uuid] ?? 'empty'}
                    readOnly={readOnly}
                  />
                ))}
              </Styled.CheckmarkGroup>
            )
          })}
        </Styled.CheckmarkGroup>
      </Styled.BodyRow>
      {expanded &&
        outcome.children.map((childUuid) => (
          <TagGroupRow
            key={childUuid}
            table={table}
            uuid={childUuid}
            readOnly={readOnly}
          />
        ))}
    </>
  )
}

const NodeCheckmark = ({
  table,
  nodeUuid,
  outcomeUuid,
  outcomeTitle,
  status,
  readOnly
}: {
  table: OutcomeTable
  nodeUuid: string
  outcomeUuid: string
  outcomeTitle: string
  status: OutcomeCheckmarkStatus
  readOnly: boolean
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const { t } = useTranslation('workflow')
  const nodeTitle = useNodeTitle(table.entities.nodes[nodeUuid])
  const assignmentPending = useOutcomeAssignmentPending(
    table.board.uuid,
    nodeUuid,
    outcomeUuid
  )
  const onClick = () => {
    const params = {
      graphUuid: table.board.uuid,
      nodeUuid,
      outcomeUuid,
      affectedOutcomeUuids: affectedOutcomeUuids(
        table.outcomeTree.outcomes,
        outcomeUuid
      )
    }
    void dispatch(
      status === 'full' ? unlinkNodeOutcome(params) : linkNodeOutcome(params)
    ).catch((error: unknown) => {
      if (!isApiErrorNotificationHandled(error)) {
        enqueueSnackbar(t('outcomeTable.assignmentUpdateFailed'), {
          variant: 'error'
        })
      }
    })
  }

  return (
    <Checkmark
      label={t('outcomeTable.assignmentCellLabel', {
        outcome: outcomeTitle,
        node: nodeTitle
      })}
      readOnly={readOnly || assignmentPending}
      value={status}
      onClick={onClick}
    />
  )
}

export default TableBody
