import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
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
  const graphSelector = useMemo(
    () => selectGraphByUuid(graphUuid),
    [graphUuid]
  )
  const graph = useSelector(graphSelector)
  const linkedWorkflowSelector = useMemo(
    () =>
      node?.linkedWorkflowUuid
        ? selectWorkflowByUuid(node.linkedWorkflowUuid)
        : () => undefined,
    [node?.linkedWorkflowUuid]
  )
  const linkedWorkflow = useSelector(linkedWorkflowSelector)
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
    onDrop
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
          <StyledNode.Title variant="body2">
            {displayTitle} <br />
            <small>{`#${nodeId}, row: ${node.sectionRow ?? '?'}`}</small>
          </StyledNode.Title>
          <Meta
            workflow={node.linkedWorkflowUuid ?? null}
            parentWorkflowType={graph?.workflowType}
            contextType={node.contextClassification ?? 0}
            taskType={node.taskClassification ?? 0}
            time={{
              length: node.timeRequired ?? 0,
              unit: node.timeUnits ?? 0
            }}
          />
        </StyledNode.Content>

        {!dnd.dragging && <Handles nodeUuid={nodeId} nodeRef={wrapRef} />}
      </StyledNode.CellInner>

      {(dnd.closestEdge || edgeIndicator) && (
        <DropIndicator edge={edgeIndicator || dnd.closestEdge} />
      )}

      {dnd.dragging &&
        dnd.previewTarget &&
        createPortal(
          <StyledNode.CellInner style={{ width: '180px', minHeight: '70px' }}>
            <StyledNode.Border style={{ backgroundColor: borderColor }} />
            <StyledNode.Content>
              <StyledNode.Title variant="body2">{displayTitle}</StyledNode.Title>
            </StyledNode.Content>
          </StyledNode.CellInner>,
          dnd.previewTarget
        )}
    </>
  )
}

export default SectionCellNode
