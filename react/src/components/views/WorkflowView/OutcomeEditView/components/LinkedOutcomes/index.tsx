import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import { displayOutcomeTitle } from '@cf/features/graph/outcomeTitle'
import type { OutcomeEntity } from '@cf/features/graph/state/model/types'
import {
  getPrefixPath,
  selectOutcomeChildrenById,
  selectOutcomeEntities
} from '@cf/features/graph/state/selectors/outcomes.selectors'
import { unlinkNodeOutcome } from '@cf/features/graph/state/thunks/graphMutations.thunks'
import type { AppDispatch, RootState } from '@cf/redux/store'
import OutcomeHeader from '@cfSidebar/components/OutcomesTab/Outcome/Header'
import * as StyledOutcome from '@cfViews/WorkflowView/OutcomeEditView/components/OutcomeTree/styles'
import LinkOffOutlinedIcon from '@mui/icons-material/LinkOffOutlined'
import Tooltip from '@mui/material/Tooltip'
import { MouseEvent, useCallback, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import * as Styled from './styles'
import type { LinkedOutcomesPropsType } from './types'

const LinkedOutcomeRow = ({
  graphUuid,
  nodeUuid,
  outcome,
  assignedOutcomeUuids,
  hoveredOutcomeUuid,
  setHoveredOutcomeUuid
}: {
  graphUuid: string
  nodeUuid: string
  outcome: OutcomeEntity
  assignedOutcomeUuids: Set<string>
  hoveredOutcomeUuid: string | null
  setHoveredOutcomeUuid: (uuid: string | null) => void
}) => {
  const { t } = useTranslation('workflow')
  const dispatch = useDispatch<AppDispatch>()
  const rowRef = useRef<HTMLDivElement>(null)
  const [collapsed, setCollapsed] = useState(true)
  const canShowActions = useResourcePermission(WorkflowPermission.COMMENT)
  const canUnlink = useResourcePermission(WorkflowPermission.ASSIGN_OUTCOMES)
  const prefix = useSelector((state: RootState) =>
    getPrefixPath(state, graphUuid, outcome.uuid)
  )
  const children = useSelector((state: RootState) =>
    selectOutcomeChildrenById(state, graphUuid, outcome.uuid)
  ).filter((child) => assignedOutcomeUuids.has(child.uuid))

  const level = prefix.split('.').length - 2

  const onToggleClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    setCollapsed((value) => !value)
  }, [])

  const onUnlink = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation()
      if (!canUnlink) {
        return
      }
      void dispatch(
        unlinkNodeOutcome({
          graphUuid,
          nodeUuid,
          outcomeUuid: outcome.uuid
        })
      )
    },
    [canUnlink, dispatch, graphUuid, nodeUuid, outcome.uuid]
  )

  return (
    <StyledOutcome.OutcomeWrapper
      onMouseLeave={() => {
        if (hoveredOutcomeUuid === outcome.uuid) {
          setHoveredOutcomeUuid(null)
        }
      }}
    >
      <OutcomeHeader
        uuid={outcome.uuid}
        level={level}
        dragRef={rowRef}
        title={`${prefix}${displayOutcomeTitle(
          outcome,
          t,
          t('outcomes.untitled')
        )}`}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        showToggle={children.length > 0}
        onToggleClick={onToggleClick}
        highlighted={false}
        onClick={() => undefined}
        onContentMouseEnter={() => setHoveredOutcomeUuid(outcome.uuid)}
        action={
          hoveredOutcomeUuid === outcome.uuid && canShowActions ? (
            <Tooltip title={t('related.unlinkOutcome')} disableInteractive>
              <span>
                <Styled.UnlinkButton
                  aria-label={t('related.unlinkOutcome')}
                  disabled={!canUnlink}
                  size="small"
                  onClick={onUnlink}
                >
                  <LinkOffOutlinedIcon fontSize="small" />
                </Styled.UnlinkButton>
              </span>
            </Tooltip>
          ) : undefined
        }
      />

      {!collapsed && children.length > 0 && (
        <StyledOutcome.OutcomeGroup>
          {children.map((child) => (
            <StyledOutcome.OutcomeGroupItem key={child.uuid}>
              <LinkedOutcomeRow
                graphUuid={graphUuid}
                nodeUuid={nodeUuid}
                outcome={child}
                assignedOutcomeUuids={assignedOutcomeUuids}
                hoveredOutcomeUuid={hoveredOutcomeUuid}
                setHoveredOutcomeUuid={setHoveredOutcomeUuid}
              />
            </StyledOutcome.OutcomeGroupItem>
          ))}
        </StyledOutcome.OutcomeGroup>
      )}
    </StyledOutcome.OutcomeWrapper>
  )
}

const LinkedOutcomes = ({
  graphUuid,
  parent,
  outcomes,
  highlight
}: LinkedOutcomesPropsType & { graphUuid: string }) => {
  const [show, setShow] = useState(false)
  const [hoveredOutcomeUuid, setHoveredOutcomeUuid] = useState<string | null>(
    null
  )
  const wrapRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLSpanElement>(null)
  const outcomeEntities = useSelector(selectOutcomeEntities)
  const assignedOutcomeUuids = useMemo(() => new Set(outcomes), [outcomes])
  const topLevelOutcomes = useMemo(
    () =>
      outcomes
        .map((uuid) => outcomeEntities[uuid])
        .filter(
          (outcome): outcome is OutcomeEntity =>
            Boolean(outcome) &&
            (!outcome.parentUuid ||
              !assignedOutcomeUuids.has(outcome.parentUuid))
        )
        .sort((left, right) => left.order - right.order),
    [assignedOutcomeUuids, outcomeEntities, outcomes]
  )

  const showPopover = useCallback((value: boolean) => {
    return (event: MouseEvent<HTMLSpanElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setShow(value)
    }
  }, [])

  return (
    <Styled.Wrap ref={wrapRef} type={parent.type}>
      <Styled.Badge
        ref={badgeRef}
        onClick={showPopover(true)}
        badgeContent={topLevelOutcomes.length}
        highlight={highlight}
        type={parent.type}
      />
      <Styled.Popover
        open={show}
        anchorEl={wrapRef.current}
        onClose={showPopover(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <StyledOutcome.OutcomeGroup sx={{ mt: 0 }}>
          {topLevelOutcomes.map((outcome) => (
            <StyledOutcome.OutcomeGroupItem key={outcome.uuid}>
              <LinkedOutcomeRow
                graphUuid={graphUuid}
                nodeUuid={parent.uuid}
                outcome={outcome}
                assignedOutcomeUuids={assignedOutcomeUuids}
                hoveredOutcomeUuid={hoveredOutcomeUuid}
                setHoveredOutcomeUuid={setHoveredOutcomeUuid}
              />
            </StyledOutcome.OutcomeGroupItem>
          ))}
        </StyledOutcome.OutcomeGroup>
      </Styled.Popover>
    </Styled.Wrap>
  )
}

export default LinkedOutcomes
