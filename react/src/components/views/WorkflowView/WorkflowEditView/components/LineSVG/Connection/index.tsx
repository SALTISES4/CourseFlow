import BetterSelectionManager from '@cf/redux/BetterSelectionManager'
import { selectIsDrawingLinkPreview } from '@cf/redux/selectors/nodelink.selector'
import { dragEndThunk, svglinkLineEdit } from '@cf/redux/slices/svglink.slice'
import { AppDispatch, RootState } from '@cf/redux/store'
import { CfObjectType } from '@cf/types/enum'
import { Handle as StyledHandle } from '@cfViews/WorkflowView/WorkflowEditView/components/LineSVG/Handles/styles'
import { Position, getSmoothStepPath } from '@xyflow/react'
import { produce } from 'immer'
import {
  MutableRefObject,
  MouseEvent as ReactMouseEvent,
  useCallback,
  useMemo,
  useState
} from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { ConnectionType } from '../types'
import { getCoords } from '../utility'

type PositionCoords = ReturnType<typeof getCoords>

type ConnectionState = {
  hovering: boolean
  highlighted: boolean
}

const Connection = ({
  id,
  from,
  to,
  svgRef
}: ConnectionType & {
  svgRef: MutableRefObject<SVGSVGElement | null>
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const isDraggingPreview = useSelector(selectIsDrawingLinkPreview)
  const [state, setState] = useState<ConnectionState>({
    hovering: false,
    highlighted: false
  })

  const manager = useMemo(
    () => new BetterSelectionManager(dispatch),
    [dispatch]
  )

  const selected = useSelector(
    (state: RootState) =>
      state.sidebar.edit.objectType === CfObjectType.NODELINK &&
      state.sidebar.edit.id === id
  )

  const [fromId, fromEdge] = from
  const [toId, toEdge] = to

  const onMouseDown = useCallback(
    (
      lineStart: PositionCoords,
      lineEnd: PositionCoords,
      editing: 'from' | 'to'
    ) => {
      return (e: ReactMouseEvent<SVGCircleElement>) => {
        e.stopPropagation()
        e.preventDefault()

        const args = {
          id,
          from: {
            nodeId: fromId,
            x: lineStart.x,
            y: lineStart.y,
            edge: fromEdge as Position
          },
          to: {
            nodeId: toId,
            x: lineEnd.x,
            y: lineEnd.y,
            edge: toEdge as Position
          },
          editing
        }

        dispatch(svglinkLineEdit(args))

        // this is so crappy
        const onMouseMove = (e: MouseEvent) => {
          const svgBCR = svgRef.current.getBoundingClientRect()
          const moveArgs = {
            ...args,
            [editing]: {
              ...args[editing],
              x: e.clientX - svgBCR.left,
              y: e.clientY - svgBCR.top
            }
          }
          dispatch(svglinkLineEdit(moveArgs))
        }

        const onMouseUp = () => {
          dispatch(dragEndThunk())
          window.removeEventListener('mousemove', onMouseMove)
          window.removeEventListener('mouseup', onMouseUp)
        }

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
      }
    },
    [id, fromId, fromEdge, toId, toEdge, dispatch, svgRef]
  )

  const toggleHover = useCallback(() => {
    setState(
      produce((draft) => {
        draft.hovering = !draft.hovering
      })
    )
  }, [])

  const toggleSelected = useCallback(() => {
    manager.updateSidebar(id, CfObjectType.NODELINK)
  }, [id, manager])

  let strokeColor = '#666' // actually '#CBD5DF'
  if (state.hovering) {
    strokeColor = '#7CD5B9'
  }
  if (state.highlighted || selected) {
    strokeColor = '#FCD748'
  }

  const fromEl = document.getElementById(`node-${fromId}`)
  const toEl = document.getElementById(`node-${toId}`)

  if (!fromEl || !toEl || !svgRef?.current) {
    return null
  }

  const svgBCR = svgRef.current.getBoundingClientRect()
  const fromBCR = fromEl.getBoundingClientRect()
  const toBCR = toEl.getBoundingClientRect()

  const lineStart = getCoords(fromBCR, fromEdge)
  const lineEnd = getCoords(toBCR, toEdge)

  // adjust positions for the SVG BCR
  lineStart.x -= svgBCR.left
  lineStart.y -= svgBCR.top

  lineEnd.x -= svgBCR.left
  lineEnd.y -= svgBCR.top

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX: lineStart.x,
    sourceY: lineStart.y,
    sourcePosition: fromEdge as Position,
    targetX: lineEnd.x,
    targetY: lineEnd.y,
    targetPosition: toEdge as Position
  })

  const lineId = `line-${fromId}-${fromEdge}-to-${toId}-${toEdge}`

  return (
    <g fill="none" data-nodelink-id={id}>
      <path
        d={path}
        stroke={strokeColor}
        strokeWidth={selected ? 3 : 1}
        opacity={isDraggingPreview ? 0.2 : 1}
        fill="none"
        markerEnd="url(#line-arrow)"
      />
      <path
        id={lineId}
        d={path}
        stroke="transparent"
        strokeWidth="16"
        fill="none"
        onMouseEnter={toggleHover}
        onMouseLeave={toggleHover}
        onClick={toggleSelected}
        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
      />
      {selected && (
        <>
          <StyledHandle
            cx={lineStart.x}
            cy={lineStart.y}
            r={6}
            sx={{ cursor: 'grab', stroke: strokeColor }}
            onMouseDown={onMouseDown(lineStart, lineEnd, 'from')}
          />
          <StyledHandle
            cx={lineEnd.x}
            cy={lineEnd.y}
            r={6}
            sx={{ cursor: 'grab', stroke: strokeColor }}
            onMouseDown={onMouseDown(lineStart, lineEnd, 'to')}
          />

          {/* <text x={labelX} y={labelY} fill="red">
            Line text label
          </text> */}
        </>
      )}
    </g>
  )
}

export default Connection
