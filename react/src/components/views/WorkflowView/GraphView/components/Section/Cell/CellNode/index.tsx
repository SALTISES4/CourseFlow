import type { NodeEntity } from '@cf/features/graph/state/model/types'
import { selectNodeByUuid } from '@cf/features/graph/state/selectors/canonical.selectors'
import { isHighlightedViaOutcome } from '@cf/redux/selectors/outcomes.selector'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
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

const SectionCellNode = ({
  nodeId,
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
  const node = useSelector(nodeSelector) as NodeEntity | undefined
  const dnd = useCellNodeDnd({
    wrapRef,
    nodeId,
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

  const legacyOutcomes = node
    ? (node as unknown as { outcomenodeSet?: number[] }).outcomenodeSet
    : undefined

  if (!node) {
    return null
  }

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

        {!!legacyOutcomes?.length && (
          <LinkedOutcomes
            parent={{ uuid: nodeId, type: SectionCellType.NODE }}
            outcomes={legacyOutcomes}
            highlight={highlighted}
          />
        )}

        <StyledNode.Border style={{ backgroundColor: borderColor }} />
        <StyledNode.Content onClick={onNodeClicked}>
          <StyledNode.Title variant="body2">
            {(node as unknown as { title?: string }).title ||
              _t('Blank title')}{' '}
            <br />
            <small>{`#${nodeId}, row: ${node.sectionRow ?? '?'}`}</small>
          </StyledNode.Title>
          <Meta
            workflow={
              (node as unknown as { linkedWorkflow?: number | null })
                .linkedWorkflow ?? null
            }
            contextType={
              (node as unknown as { contextClassification?: number })
                .contextClassification ?? 0
            }
            taskType={
              (node as unknown as { taskClassification?: number })
                .taskClassification ?? 0
            }
            time={{
              length:
                (node as unknown as { timeRequired?: number }).timeRequired ??
                0,
              unit:
                (node as unknown as { timeUnits?: number }).timeUnits ?? 0
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
              <StyledNode.Title variant="body2">
                {(node as unknown as { title?: string }).title ||
                  _t('Blank title')}
              </StyledNode.Title>
            </StyledNode.Content>
          </StyledNode.CellInner>,
          dnd.previewTarget
        )}
    </>
  )
}

export default SectionCellNode
