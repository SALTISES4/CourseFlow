import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  draggable,
  dropTargetForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { selectNodeById } from '@cf/redux/selectors/node.selector'
import { svglinkAllowDND } from '@cf/redux/slices/svglink.slice'
import { CfObjectType } from '@cf/types/enum'
import { nodelinkOutcome } from '@cfRedux/slices/node.slice'
import { isOutcomeLink } from '@cfRedux/slices/outcomes.slice'
import { RootState } from '@cfRedux/store'
import LinkedOutcomes from '@cfViews/WorkflowView/OutcomeEditView/components/LinkedOutcomes'
import { alpha } from '@mui/material'
import { produce } from 'immer'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import HoverMenu from './HoverMenu'
import Meta from './Meta'
import * as StyledNode from './styles'
import { NodePropsType, PhantomPropsType, WeekCellNodeType } from './types'
import * as Styled from '../../../styles'
import { CellDataType, DraggableType } from '../../../types'
import { isGridCell } from '../../../types'
import Handles from '../../LineSVG/Handles'

type PropsType = PhantomPropsType | NodePropsType

const WeekCellPhantom = ({
  columnId,
  coordsX,
  borderColor,
  onReorder
}: PhantomPropsType) => {
  const ref = useRef<HTMLDivElement>(null)
  const [draggedOver, setDraggedOver] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) {
      return null
    }

    return dropTargetForElements({
      element: el,
      onDragEnter: () => setDraggedOver(true),
      onDragLeave: () => setDraggedOver(false),
      canDrop: ({ source }) => isGridCell(source.data),
      onDrop: ({ source }) => {
        const data = source.data
        if (!isGridCell(data)) {
          return null
        }

        if (data.coords.x !== coordsX) {
          onReorder(data.id, data.coords.week, columnId)
        }
        setDraggedOver(false)
      }
    })
  }, [coordsX, columnId, onReorder])

  return (
    <Styled.Cell
      ref={ref}
      sx={{ backgroundColor: draggedOver && alpha(borderColor, 0.2) }}
    >
      <div style={{ backgroundColor: borderColor }} />
    </Styled.Cell>
  )
}

const WeekCellNode = ({
  nodeId,
  coordsWeek,
  coordsX,
  coordsY,
  borderColor,
  onClick
}: NodePropsType) => {
  const dispatch = useDispatch()
  const node = useSelector((state: RootState) => selectNodeById(state, nodeId))
  const ref = useRef<HTMLDivElement>(null)

  const selected = useSelector(
    (state: RootState) =>
      state.sidebar.edit.objectType === CfObjectType.NODE &&
      state.sidebar.edit.id === node.id
  )

  const [state, setState] = useState({
    dragging: false,
    dropHighlight: false
  })

  const toggleState = useCallback(
    (property: 'dragging' | 'dropHighlight', value?: boolean) => {
      if (property === 'dragging') {
        dispatch(svglinkAllowDND(value ?? false))
      }

      setState(
        produce((draft) => {
          draft[property] = value ?? !draft[property]
        })
      )
    },
    [dispatch]
  )

  useEffect(() => {
    const el = ref.current
    if (!el) {
      return
    }

    return combine(
      dropTargetForElements({
        element: el,
        canDrop: ({ source }) => isOutcomeLink(source.data),
        onDragEnter: () => toggleState('dropHighlight', true),
        onDragLeave: () => toggleState('dropHighlight', false),
        onDrop: ({ source }) => {
          const data = source.data
          if (isOutcomeLink(data)) {
            dispatch(nodelinkOutcome({ outcomeId: data.id, nodeId }))
          }
          toggleState('dropHighlight', false)
        }
      }),
      draggable({
        element: el,
        getInitialData: (): CellDataType => ({
          id: nodeId,
          coords: {
            week: coordsWeek,
            x: coordsX,
            y: coordsY
          },
          type: DraggableType.CELL
        }),
        onDragStart: () => toggleState('dragging', true),
        onDrop: () => toggleState('dragging', false)
      })
    )
  }, [ref, dispatch, nodeId, toggleState, coordsWeek, coordsX, coordsY])

  return (
    <Styled.Cell ref={ref}>
      <Styled.CellInner
        id={`node-${nodeId}`}
        selected={selected}
        dropHighlight={state.dropHighlight}
        dragShrink={state.dragging}
      >
        <HoverMenu nodeId={nodeId} nodeRef={ref} />

        {!!node.outcomenodeSet?.length && (
          <LinkedOutcomes
            parent={{ id: nodeId, type: 'node' }}
            outcomes={node.outcomenodeSet}
          />
        )}

        <StyledNode.Border sx={{ backgroundColor: borderColor }} />
        <StyledNode.Content onClick={onClick}>
          <StyledNode.Title variant="body2">
            {node.title || `Empty title (#${nodeId})`}
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

        <Handles nodeId={nodeId} nodeRef={ref} />
      </Styled.CellInner>
    </Styled.Cell>
  )
}

const WeekCell = (props: PropsType) => {
  console.log(`${props.coordsY + 1} x ${props.coordsX + 1}`)
  return props.type === WeekCellNodeType.PHANTOM ? (
    <WeekCellPhantom {...props} />
  ) : (
    <WeekCellNode {...props} />
  )
}

export default memo(WeekCell)
