import { Position, getSmoothStepPath } from '@xyflow/react'
import { produce } from 'immer'
import { MutableRefObject, useCallback, useState } from 'react'

import { ConnectionType } from '../types'
import { getCoords } from '../utility'

type ConnectionState = {
  hovering: boolean
  selected: boolean
  highlighted: boolean
}

const Connection = ({
  id,
  from,
  to,
  offset,
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
    return null
  }

  const svgBCR = svgRef.current.getBoundingClientRect()
  const fromBCR = fromEl.getBoundingClientRect()
  const toBCR = toEl.getBoundingClientRect()

  const lineStart = getCoords(fromBCR, fromEdge)
  const lineEnd = getCoords(toBCR, toEdge)

  // adjust positions for the SVG BCR
  lineStart.x -= svgBCR.left + offset.from.x
  lineStart.y -= svgBCR.top + offset.from.y

  lineEnd.x -= svgBCR.left + offset.to.x
  lineEnd.y -= svgBCR.top + offset.to.y

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

export default Connection
