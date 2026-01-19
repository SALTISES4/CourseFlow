import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  draggable,
  dropTargetForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import {
  Edge,
  attachClosestEdge,
  extractClosestEdge
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box'
import { selectNodeById } from '@cf/redux/selectors/node.selector'
import { svglinkAllowDND } from '@cf/redux/slices/svglink.slice'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import { nodelinkOutcome } from '@cfRedux/slices/node.slice'
import { isOutcomeLink } from '@cfRedux/slices/outcomes.slice'
import { RootState } from '@cfRedux/store'
import LinkedOutcomes from '@cfViews/WorkflowView/OutcomeEditView/components/LinkedOutcomes'
import { produce } from 'immer'
import { MouseEvent, useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'

import * as Styled from '../../../../styles'
import { CellDataType, DraggableType } from '../../../../types'
import { isGridCell } from '../../../../types'
import Handles from '../../../LineSVG/Handles'
import HoverMenu from '../HoverMenu'
import Meta from '../Meta'
import * as StyledNode from '../styles'
import { WeekCellNodeTypeTypeInternal, WeekCellType } from '../types'

type NodeStateType = {
  dragging: boolean
  dropHighlight: boolean
  closestEdge: Edge | null
  previewTarget?: HTMLElement | null
}

const WeekCellNode = ({
  nodeId,
  columnId,
  coordsWeek,
  coordsX,
  coordsY,
  borderColor,
  wrapRef,
  onClick,
  onDrop
}: WeekCellNodeTypeTypeInternal) => {
  const dispatch = useDispatch()
  const node = useSelector((state: RootState) => selectNodeById(state, nodeId))

  const onNodeClicked = useCallback(
    (e: MouseEvent<HTMLDivElement>) => onClick(e, nodeId),
    [onClick, nodeId]
  )

  const selected = useSelector(
    (state: RootState) =>
      state.sidebar.edit.objectType === CfObjectType.NODE &&
      state.sidebar.edit.id === node.id
  )

  const [state, setState] = useState<NodeStateType>({
    dragging: false,
    dropHighlight: false,
    closestEdge: null
  })

  const toggleState = useCallback(
    (newState: Partial<NodeStateType>) => {
      if ('dragging' in newState) {
        dispatch(svglinkAllowDND(newState.dragging ?? false))
      }

      setState(
        produce((draft) => {
          for (const [key, value] of Object.entries(newState)) {
            draft[key] = value ?? !draft[key]
          }
        })
      )
    },
    [dispatch]
  )

  useEffect(() => {
    const el = wrapRef.current
    if (!el) {
      return
    }

    return combine(
      dropTargetForElements({
        element: el,
        getData: ({ input, element }) => {
          return attachClosestEdge(
            {},
            {
              input,
              element,
              allowedEdges: ['top', 'bottom']
            }
          )
        },
        canDrop: ({ source }) =>
          isOutcomeLink(source.data) || isGridCell(source.data),
        onDragEnter: ({ source }) => {
          if (isOutcomeLink(source.data)) {
            toggleState({ dropHighlight: true })
          }
        },
        onDragLeave: ({ source }) => {
          if (isOutcomeLink(source.data)) {
            toggleState({ dropHighlight: false })
          }
          toggleState({ closestEdge: null })
        },
        onDrag: ({ source, self }) => {
          const dragging = source.data
          if (isGridCell(dragging) && dragging.id !== nodeId) {
            setState(
              produce((draft) => {
                draft.closestEdge = extractClosestEdge(self.data)
              })
            )
          }
        },
        onDrop: ({ source, self }) => {
          const dropped = source.data
          if (isOutcomeLink(dropped)) {
            dispatch(nodelinkOutcome({ outcomeId: dropped.id, nodeId }))
          }

          if (isGridCell(dropped) && dropped.id !== nodeId) {
            onDrop({
              type: WeekCellType.NODE,
              edge: extractClosestEdge(self.data) as 'top' | 'bottom',
              id: dropped.id,
              fromWeek: dropped.coords.week,
              toWeek: coordsWeek,
              toColumn: columnId,
              toRow: coordsY
            })
          }

          toggleState({ dropHighlight: false, closestEdge: null })
        }
      }),
      draggable({
        element: el,
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          setCustomNativeDragPreview({
            getOffset: pointerOutsideOfPreview({
              x: '16px',
              y: '10px'
            }),
            render({ container }) {
              toggleState({ dragging: true, previewTarget: container })
              // cleanup, docs?
              // return () => {
              //   return toggleState({ dragging: false, preview: null })
              // }
            },
            nativeSetDragImage
          })
        },
        getInitialData: (): CellDataType => ({
          id: nodeId,
          coords: {
            week: coordsWeek,
            x: coordsX,
            y: coordsY
          },
          type: DraggableType.CELL
        }),
        onDragStart: () => toggleState({ dragging: true }),
        onDrop: () => toggleState({ dragging: false, previewTarget: null })
      })
    )
  }, [
    columnId,
    coordsWeek,
    coordsX,
    coordsY,
    nodeId,
    wrapRef,
    dispatch,
    toggleState,
    onDrop
  ])

  return (
    <>
      <Styled.CellInner
        id={`node-${nodeId}`}
        selected={selected}
        dropHighlight={state.dropHighlight}
        dragging={state.dragging}
      >
        {!state.dragging && <HoverMenu nodeId={nodeId} nodeRef={wrapRef} />}

        {!!node.outcomenodeSet?.length && (
          <LinkedOutcomes
            parent={{ id: nodeId, type: WeekCellType.NODE }}
            outcomes={node.outcomenodeSet}
          />
        )}

        <StyledNode.Border sx={{ backgroundColor: borderColor }} />
        <StyledNode.Content onClick={onNodeClicked}>
          <StyledNode.Title variant="body2">
            {node.title || _t('Blank title')} <br />
            <small>{`#${nodeId}, row: ${node.order}`}</small>
          </StyledNode.Title>
          <Meta
            workflow="#"
            contextType={node.contextClassification}
            taskType={node.taskClassification}
            time={{
              length: node.timeRequired,
              unit: node.timeUnits
            }}
          />
        </StyledNode.Content>

        {!state.dragging && <Handles nodeId={nodeId} nodeRef={wrapRef} />}
      </Styled.CellInner>

      {state.closestEdge && (
        <DropIndicator edge={state.closestEdge} type="no-terminal" gap="32px" />
      )}

      {state.dragging &&
        state.previewTarget &&
        createPortal(
          <Styled.CellInner
            sx={{ width: '180px', minHeight: '70px' }}
            dragging={false}
            dropHighlight={false}
            selected={false}
          >
            <StyledNode.Border sx={{ backgroundColor: borderColor }} />
            <StyledNode.Content>
              <StyledNode.Title variant="body2">
                {node.title || _t('Blank title')}
              </StyledNode.Title>
            </StyledNode.Content>
          </Styled.CellInner>,
          state.previewTarget
        )}
    </>
  )
}

export default WeekCellNode
