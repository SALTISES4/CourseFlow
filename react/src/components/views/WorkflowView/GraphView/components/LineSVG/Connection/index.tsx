import { WorkflowPermission } from '@cf/api/gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import { selectIsDrawingLinkPreview } from '@cf/features/graph/state/selectors/svglink.selectors'
import { svglinkLineEdit } from '@cf/features/graph/state/slices/svglink.slice'
import { dragEndThunk } from '@cf/features/graph/state/thunks/svglink.thunk'
import BetterSelectionManager from '@cf/features/selection/betterSelectionManager'
import { AppDispatch, RootState } from '@cf/redux/store'
import { CfObjectType } from '@cf/types/enum'
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

import { Handle as StyledHandle } from '../../../components/LineSVG/Handles/styles'
import { ConnectionType } from '../types'
import { getCoords } from '../utility'

type PositionCoords = ReturnType<typeof getCoords>

type ConnectionState = {
  hovering: boolean
}

function getConnectionPath(
  lineStart: PositionCoords,
  lineEnd: PositionCoords,
  fromEdge: Position,
  toEdge: Position,
  laneOffset: number
): [string, number, number] {
  const sameHorizontalSide =
    fromEdge === toEdge &&
    (fromEdge === Position.Right || fromEdge === Position.Left)
  if (sameHorizontalSide) {
    const direction = fromEdge === Position.Right ? 1 : -1
    const sourceOutX = lineStart.x + direction * 20
    const targetOutX = lineEnd.x + direction * 20
    const aligned = Math.abs(lineStart.y - lineEnd.y) < 1
    const laneY = aligned
      ? Math.min(lineStart.y, lineEnd.y) - 55 - laneOffset
      : (lineStart.y + lineEnd.y) / 2 + laneOffset * 0.4
    return [
      `M ${lineStart.x} ${lineStart.y} L ${sourceOutX} ${lineStart.y} L ${sourceOutX} ${laneY} L ${targetOutX} ${laneY} L ${targetOutX} ${lineEnd.y} L ${lineEnd.x} ${lineEnd.y}`,
      (sourceOutX + targetOutX) / 2,
      laneY
    ]
  }

  const sameVerticalSide =
    fromEdge === toEdge &&
    (fromEdge === Position.Top || fromEdge === Position.Bottom)
  if (sameVerticalSide) {
    const direction = fromEdge === Position.Bottom ? 1 : -1
    const sourceOutY = lineStart.y + direction * 20
    const targetOutY = lineEnd.y + direction * 20
    const aligned = Math.abs(lineStart.x - lineEnd.x) < 1
    const laneX = aligned
      ? Math.min(lineStart.x, lineEnd.x) - 55 - laneOffset
      : (lineStart.x + lineEnd.x) / 2 + laneOffset * 0.4
    return [
      `M ${lineStart.x} ${lineStart.y} L ${lineStart.x} ${sourceOutY} L ${laneX} ${sourceOutY} L ${laneX} ${targetOutY} L ${lineEnd.x} ${targetOutY} L ${lineEnd.x} ${lineEnd.y}`,
      laneX,
      (sourceOutY + targetOutY) / 2
    ]
  }

  const laneCenter =
    fromEdge === toEdge
      ? fromEdge === Position.Right
        ? { centerX: Math.max(lineStart.x, lineEnd.x) + 20 + laneOffset }
        : fromEdge === Position.Left
          ? { centerX: Math.min(lineStart.x, lineEnd.x) - 20 + laneOffset }
          : fromEdge === Position.Bottom
            ? { centerY: Math.max(lineStart.y, lineEnd.y) + 20 + laneOffset }
            : { centerY: Math.min(lineStart.y, lineEnd.y) - 20 + laneOffset }
      : {}

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX: lineStart.x,
    sourceY: lineStart.y,
    sourcePosition: fromEdge,
    targetX: lineEnd.x,
    targetY: lineEnd.y,
    targetPosition: toEdge,
    ...laneCenter
  })
  return [path, labelX, labelY]
}

const Connection = ({
  uuid,
  dashed,
  fromId,
  fromEdge,
  toId,
  toEdge,
  svgRef
}: ConnectionType & {
  svgRef: MutableRefObject<SVGSVGElement | null>
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const isDraggingPreview = useSelector(selectIsDrawingLinkPreview)
  const canManageLinks = useResourcePermission(
    WorkflowPermission.NODE_LINK_MANAGEMENT
  )
  const [state, setState] = useState<ConnectionState>({
    hovering: false
  })

  const manager = useMemo(
    () => new BetterSelectionManager(dispatch),
    [dispatch]
  )

  const onClick = useCallback(
    () => manager.updateSidebar(uuid, CfObjectType.EDGE),
    [uuid, manager]
  )

  const selected = useSelector(
    (state: RootState) =>
      state.sidebar.edit.objectType === CfObjectType.EDGE &&
      state.sidebar.edit.uuid === uuid
  )

  const highlighted = useSelector(
    (state: RootState) =>
      state.sidebar.edit.objectType === CfObjectType.NODE &&
      (state.sidebar.edit.uuid === fromId || state.sidebar.edit.uuid === toId)
  )

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
          uuid,
          from: {
            nodeUuid: fromId,
            x: lineStart.x,
            y: lineStart.y,
            edge: fromEdge as Position
          },
          to: {
            nodeUuid: toId,
            x: lineEnd.x,
            y: lineEnd.y,
            edge: toEdge as Position
          },
          editing
        }

        dispatch(svglinkLineEdit(args))

        // this is so crappy
        const onMouseMove = (e: MouseEvent) => {
          const svg = svgRef.current
          if (!svg) {
            return
          }
          const svgBCR = svg.getBoundingClientRect()
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
    [uuid, fromId, fromEdge, toId, toEdge, dispatch, svgRef]
  )

  const toggleHover = useCallback((newValue: boolean) => {
    return (e: ReactMouseEvent<SVGPathElement>) => {
      setState(
        produce((draft) => {
          draft.hovering = newValue
        })
      )
    }
  }, [])

  let strokeColor = '#666' // actually '#CBD5DF'
  if (state.hovering) {
    strokeColor = '#7CD5B9'
  }
  if (highlighted || selected) {
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

  const numericEdgeId = Number(uuid)
  const laneOffset = Number.isFinite(numericEdgeId)
    ? ((numericEdgeId % 11) - 5) * 3
    : 0
  const [path, labelX, labelY] = getConnectionPath(
    lineStart,
    lineEnd,
    fromEdge as Position,
    toEdge as Position,
    laneOffset
  )
  // Axis-aligned SVG paths have a zero-width or zero-height DOM box. Add a
  // sub-pixel segment to the transparent hit path so it remains an operable
  // pointer target without changing the rendered edge.
  const hitPath = `${path} M ${labelX} ${labelY} l 0.01 0.01`

  const lineId = `line-${fromId}-${fromEdge}-to-${toId}-${toEdge}`

  return (
    <g fill="none" data-edge-id={uuid}>
      <rect
        x={labelX - 0.5}
        y={labelY - 0.5}
        width={1}
        height={1}
        fill="transparent"
        pointerEvents="none"
        aria-hidden="true"
      />
      <path
        d={path}
        stroke={strokeColor}
        strokeWidth={selected || highlighted ? 2 : 1}
        strokeDasharray={dashed ? 5 : 0}
        opacity={isDraggingPreview ? 0.2 : 1}
        fill="none"
        markerEnd="url(#line-arrow)"
      />
      <path
        id={lineId}
        d={hitPath}
        stroke="transparent"
        strokeWidth="16"
        fill="none"
        onMouseEnter={toggleHover(true)}
        onMouseLeave={toggleHover(false)}
        onClick={onClick}
        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
      />
      {selected && canManageLinks && (
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
