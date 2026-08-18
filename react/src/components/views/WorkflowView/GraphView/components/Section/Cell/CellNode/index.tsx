import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import {
  selectGraphByUuid,
  selectNodeByUuid,
  selectWorkflowByUuid
} from '@cf/features/graph/state/selectors/canonical.selectors'
import { isHighlightedViaOutcome } from '@cf/features/graph/state/selectors/outcomes.selectors'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import { RootState } from '@cfRedux/store'
import { nodeTitleFallback } from '@cfSidebar/components/EditTab/components/EditNode/linkedWorkflowUi'
import LinkedOutcomes from '@cfViews/WorkflowView/OutcomeEditView/components/LinkedOutcomes'
import { useQuery } from '@tanstack/react-query'
import { MouseEvent, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'

import Handles from '../../../../components/LineSVG/Handles'
import DropIndicator from '../DropIndicator'
import HoverMenu from '../HoverMenu'
import Meta from '../Meta'
import * as StyledNode from '../styles'
import { SectionCellNodeTypeTypeInternal, SectionCellType } from '../types'
import useCellNodeDnd from './useCellNodeDnd'

const SectionCellNode = ({
  nodeId,
  graphUuid,
  columnId,
  coordsSection,
  coordsX,
  coordsY,
  borderColor,
  wrapRef,
  highlight,
  onClick,
  onDrop
}: SectionCellNodeTypeTypeInternal) => {
  const nodeSelector = useMemo(() => selectNodeByUuid(nodeId), [nodeId])
  const node = useSelector(nodeSelector)
  const graphSelector = useMemo(() => selectGraphByUuid(graphUuid), [graphUuid])
  const graph = useSelector(graphSelector)
  const linkedWorkflowSelector = useMemo(
    () =>
      node?.linkedWorkflowUuid
        ? selectWorkflowByUuid(node.linkedWorkflowUuid)
        : () => undefined,
    [node?.linkedWorkflowUuid]
  )
  const linkedWorkflow = useSelector(linkedWorkflowSelector)
  const canMoveNodes = useResourcePermission(WorkflowPermission.NODE_MANAGEMENT)
  const canAssignOutcomes = useResourcePermission(
    WorkflowPermission.ASSIGN_OUTCOMES
  )
  const canManageLinks = useResourcePermission(
    WorkflowPermission.NODE_LINK_MANAGEMENT
  )
  const { data: linkedWorkflowResp } = useQuery({
    ...getWorkflowOptions({
      path: { uuid: node?.linkedWorkflowUuid ?? '' }
    }),
    enabled: Boolean(node?.linkedWorkflowUuid)
  })
  const dnd = useCellNodeDnd({
    wrapRef,
    nodeId,
    graphUuid,
    columnId,
    coordsSection,
    coordsX,
    coordsY,
    onDrop,
    nodeManagementEnabled: canMoveNodes,
    outcomeAssignmentEnabled: canAssignOutcomes
  })

  const onNodeClicked = useCallback(
    (e: MouseEvent<HTMLDivElement>) => onClick(e, nodeId),
    [onClick, nodeId]
  )

  const selected = useSelector(
    (state: RootState) =>
      state.sidebar.edit.objectType === CfObjectType.NODE &&
      state.sidebar.edit.uuid === nodeId
  )

  const highlighted = useSelector((state: RootState) =>
    isHighlightedViaOutcome(state, [])
  )

  const edgeIndicator = highlight !== 'cell' && highlight
  const lineIndicator = dnd.closestEdge || edgeIndicator

  if (!node) {
    return null
  }

  const displayTitle = node.linkedWorkflowUuid
    ? linkedWorkflowResp?.item?.title ||
      linkedWorkflow?.title ||
      node.title ||
      nodeTitleFallback()
    : node.title || nodeTitleFallback()

  return (
    <>
      <StyledNode.CellInner
        id={`node-${nodeId}`}
        data-test-id="workflow-node"
        selected={selected}
        highlighted={highlighted}
        dropHighlight={dnd.dropHighlight}
        dragging={dnd.dragging}
      >
        {!dnd.dragging && (
          <HoverMenu
            nodeId={nodeId}
            graphUuid={node.graphUuid}
            nodeRef={wrapRef}
            threadUuid={node.threadUuid}
          />
        )}

        {node.outcomeUuids.length > 0 && (
          <LinkedOutcomes
            graphUuid={node.graphUuid}
            parent={{
              uuid: nodeId,
              type: SectionCellType.NODE,
              graphUuid: node.graphUuid
            }}
            outcomes={node.outcomeUuids}
            highlight={highlighted}
          />
        )}

        <StyledNode.Border style={{ backgroundColor: borderColor }} />
        <StyledNode.Content onClick={onNodeClicked}>
          <StyledNode.Title variant="body2">{displayTitle}</StyledNode.Title>
          <Meta
            workflow={node.linkedWorkflowUuid ?? null}
            parentWorkflowType={graph?.workflowType}
            contextType={node.contextClassification ?? 0}
            taskType={node.taskClassification ?? 0}
            time={node.timeRequired ?? 0}
          />
        </StyledNode.Content>

        {!dnd.dragging && canManageLinks && (
          <Handles nodeUuid={nodeId} nodeRef={wrapRef} />
        )}
      </StyledNode.CellInner>

      {lineIndicator && <DropIndicator edge={lineIndicator} />}

      {dnd.dragging &&
        dnd.previewTarget &&
        createPortal(
          <StyledNode.CellInner style={{ width: '180px', minHeight: '70px' }}>
            <StyledNode.Border style={{ backgroundColor: borderColor }} />
            <StyledNode.Content>
              <StyledNode.Title variant="body2">
                {displayTitle}
              </StyledNode.Title>
            </StyledNode.Content>
          </StyledNode.CellInner>,
          dnd.previewTarget
        )}
    </>
  )
}

export default SectionCellNode
