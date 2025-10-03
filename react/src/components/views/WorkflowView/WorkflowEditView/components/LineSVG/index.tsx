import { selectAllNodelink } from '@cfRedux/selectors/nodelink.selector'
import { Position, getSmoothStepPath } from '@xyflow/react'
import { produce } from 'immer'
import {
  MutableRefObject,
  useCallback,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import { useSelector } from 'react-redux'

import { ConnectionEdge, ConnectionType } from './types'

const edgeKeys: ConnectionEdge[] = ['top', 'right', 'bottom', 'left']

type PositionCoords = {
  x: number
  y: number
}

const LineSVG = () => {
  const [ready, setReady] = useState(false)
  const ref = useRef<SVGSVGElement>(null)

  const links = useSelector(selectAllNodelink).filter((link) => !link.deleted)
  const connections: ConnectionType[] = links.map((link) => ({
    from: [link.sourceNode, edgeKeys[link.sourcePort]],
    to: [link.targetNode, edgeKeys[link.targetPort]]
  }))

  // actually wait for DOM to be ready before drawing the lines
  useLayoutEffect(() => {
    setReady(true)
  }, [])

  return (
    <svg
      ref={ref}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
    >
      <defs>
        <marker
          id="line-arrow"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
        </marker>
      </defs>
      {ready &&
        connections.map((conn, index) => (
          <Connection key={index} svgRef={ref} {...conn} />
        ))}
    </svg>
  )
}

type ConnectionState = {
  hovering: boolean
  selected: boolean
  highlighted: boolean
}

function getCoords(bcr: DOMRect, direction: ConnectionEdge): PositionCoords {
  const { left, right, top, bottom, width, height } = bcr
  const posX = left + width / 2
  const posY = top + height / 2

  const positions: Record<ConnectionEdge, PositionCoords> = {
    left: { x: left, y: posY },
    right: { x: right, y: posY },
    top: { x: posX, y: top },
    bottom: { x: posX, y: bottom }
  }

  return positions[direction]
}

const Connection = ({
  from,
  to,
  svgRef
}: ConnectionType & {
  svgRef: MutableRefObject<SVGSVGElement | null>
}) => {
  const [state, setState] = useState<ConnectionState>({
    hovering: false,
    selected: false,
    highlighted: false
  })

  const toggleHover = useCallback(() => {
    setState(
      produce((draft) => {
        draft.hovering = !draft.hovering
      })
    )
  }, [])

  const toggleSelected = useCallback(() => {
    setState(
      produce((draft) => {
        draft.selected = !draft.selected
      })
    )
  }, [])

  let strokeColor = '#666' // actually '#CBD5DF'
  if (state.hovering) {
    strokeColor = '#7CD5B9'
  }
  if (state.highlighted || state.selected) {
    strokeColor = '#FCD748'
  }

  const [fromId, fromEdge] = from
  const [toId, toEdge] = to

  const fromEl = document.getElementById(`node-${fromId}`)
  const toEl = document.getElementById(`node-${toId}`)

  if (!fromEl || !toEl || !svgRef?.current) {
    return
  }

  const svgBCR = svgRef.current.getBoundingClientRect()
  const fromBCR = fromEl.getBoundingClientRect()
  const toBCR = toEl.getBoundingClientRect()

  const lineStart = getCoords(fromBCR, fromEdge)
  const lineEnd = getCoords(toBCR, toEdge)

  // adjust positions for the SVG BCR and window scrolling
  lineStart.x += window.scrollX - svgBCR.left
  lineStart.y += window.scrollY - svgBCR.top
  lineEnd.x += window.scrollX - svgBCR.left
  lineEnd.y += window.scrollY - svgBCR.top

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
    <g fill="none">
      <path
        d={path}
        stroke={strokeColor}
        strokeWidth={state.selected ? 3 : 1}
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
      {state.selected && (
        <text x={labelX} y={labelY} fill="red">
          Line text label
        </text>
      )}
    </g>
  )
}

export default LineSVG
