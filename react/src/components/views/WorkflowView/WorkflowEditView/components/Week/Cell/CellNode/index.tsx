import { selectNodeById } from '@cf/redux/selectors/node.selector'
import { isHighlightedViaOutcome } from '@cf/redux/selectors/outcomes.selector'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import { RootState } from '@cfRedux/store'
import LinkedOutcomes from '@cfViews/WorkflowView/OutcomeEditView/components/LinkedOutcomes'
import Handles from '@cfViews/WorkflowView/WorkflowEditView/components/LineSVG/Handles'
import { MouseEvent, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'

import DropIndicator from '../DropIndicator'
import HoverMenu from '../HoverMenu'
import Meta from '../Meta'
import * as StyledNode from '../styles'
import { WeekCellNodeTypeTypeInternal, WeekCellType } from '../types'
import useCellNodeDnd from './useCellNodeDnd'

const WeekCellNode = ({
  nodeId,
  columnId,
  coordsWeek,
  coordsX,
  coordsY,
  borderColor,
  wrapRef,
  highlight,
  onClick,
  onDrop
}: WeekCellNodeTypeTypeInternal) => {
  const node = useSelector((state: RootState) => selectNodeById(state, nodeId))
  const dnd = useCellNodeDnd({
    wrapRef,
    nodeId,
    columnId,
    coordsWeek,
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
      state.sidebar.edit.id === node.id
  )

  const highlighted = useSelector((state: RootState) =>
    isHighlightedViaOutcome(state, node.outcomenodeSet)
  )

  const edgeIndicator = highlight !== 'cell' && highlight

  return (
    <>
      <StyledNode.CellInner
        id={`node-${nodeId}`}
        selected={selected}
        highlighted={highlighted}
        dropHighlight={dnd.dropHighlight}
        dragging={dnd.dragging}
      >
        {!dnd.dragging && <HoverMenu nodeId={nodeId} nodeRef={wrapRef} />}

        {!!node.outcomenodeSet?.length && (
          <LinkedOutcomes
            parent={{ id: nodeId, type: WeekCellType.NODE }}
            outcomes={node.outcomenodeSet}
            highlight={highlighted}
          />
        )}

        <StyledNode.Border style={{ backgroundColor: borderColor }} />
        <StyledNode.Content onClick={onNodeClicked}>
          <StyledNode.Title variant="body2">
            {node.title || _t('Blank title')} <br />
            <small>{`#${nodeId}, row: ${node.order}`}</small>
          </StyledNode.Title>
          <Meta
            workflow={node.linkedWorkflow}
            contextType={node.contextClassification}
            taskType={node.taskClassification}
            time={{
              length: node.timeRequired,
              unit: node.timeUnits
            }}
          />
        </StyledNode.Content>

        {!dnd.dragging && <Handles nodeId={nodeId} nodeRef={wrapRef} />}
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
              <StyledNode.Title variant="body2">
                {node.title || _t('Blank title')}
              </StyledNode.Title>
            </StyledNode.Content>
          </StyledNode.CellInner>,
          dnd.previewTarget
        )}
    </>
  )
}

export default WeekCellNode
