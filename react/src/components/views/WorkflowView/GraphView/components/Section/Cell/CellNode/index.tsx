import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import {
  selectGraphByUuid,
  selectNodeByUuid
} from '@cf/features/graph/state/selectors/canonical.selectors'
import { isHighlightedViaOutcome } from '@cf/features/graph/state/selectors/outcomes.selectors'
import { selectIsDrawingLinkPreview } from '@cf/features/graph/state/selectors/svglink.selectors'
import { CfObjectType } from '@cf/types/enum'
import { RootState } from '@cfRedux/store'
import LinkedOutcomes from '@cfViews/WorkflowView/OutcomeEditView/components/LinkedOutcomes'
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
import useNodeTitle from './useNodeTitle'

const EMPTY_OUTCOME_UUIDS: string[] = []

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
  const nodeTitle = useNodeTitle(node)
  const graphSelector = useMemo(() => selectGraphByUuid(graphUuid), [graphUuid])
  const graph = useSelector(graphSelector)
  const canMoveNodes = useResourcePermission(WorkflowPermission.NODE_MANAGEMENT)
  const canAssignOutcomes = useResourcePermission(
    WorkflowPermission.ASSIGN_OUTCOMES
  )
  const canManageLinks = useResourcePermission(
    WorkflowPermission.NODE_LINK_MANAGEMENT
  )
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

  const isDraggingPreview = useSelector(selectIsDrawingLinkPreview)

  const selected = useSelector(
    (state: RootState) =>
      state.sidebar.edit.objectType === CfObjectType.NODE &&
      state.sidebar.edit.uuid === nodeId
  )

  const highlighted = useSelector((state: RootState) =>
    isHighlightedViaOutcome(state, node?.outcomeUuids ?? EMPTY_OUTCOME_UUIDS)
  )

  const edgeIndicator = highlight !== 'cell' && highlight
  const lineIndicator = dnd.closestEdge || edgeIndicator

  if (!node) {
    return null
  }

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
        {!dnd.dragging && !isDraggingPreview && (
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
          <StyledNode.Title variant="body2">{nodeTitle}</StyledNode.Title>
          <Meta
            workflow={node.linkedWorkflowUuid ?? null}
            parentWorkflowType={graph?.workflowType}
            contextType={node.contextClassification}
            taskType={node.taskClassification}
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
              <StyledNode.Title variant="body2">{nodeTitle}</StyledNode.Title>
            </StyledNode.Content>
          </StyledNode.CellInner>,
          dnd.previewTarget
        )}
    </>
  )
}

export default SectionCellNode
