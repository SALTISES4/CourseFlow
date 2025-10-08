import { selectAllNodelink } from '@cfRedux/selectors/nodelink.selector'
import { Position, getSmoothStepPath } from '@xyflow/react'
import { produce } from 'immer'
import { MutableRefObject, useCallback, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import DrawPreview from './DrawPreview'
import { edgeKeys } from './types'
import { ConnectionType } from './types'
import { generateOffsets, getCoords, groupLinksByNodeEdge } from './utility'

const LineSVG = () => {
  const ref = useRef<SVGSVGElement>(null)

  // grab all the non-deleted links
  const links = useSelector(selectAllNodelink).filter((link) => !link.deleted)

  // group links into node/edge to allow offsets
  const linksGroup = groupLinksByNodeEdge(links)

  const connections: ConnectionType[] = Object.keys(linksGroup).flatMap(
    (edgeKey) => {
      const lineGroup = linksGroup[edgeKey]

      return lineGroup.map((link) => {
        // group links by edges
        const fromEdgeId = `${link.sourceNode}-${edgeKeys[link.sourcePort]}`
        const toEdgeId = `${link.targetNode}-${edgeKeys[link.targetPort]}`

        const fromGroup = linksGroup[fromEdgeId]
        const toGroup = linksGroup[toEdgeId]

        // generate offsets for both groups
        const fromOffsets = generateOffsets(fromGroup.length)
        const toOffsets = generateOffsets(toGroup.length)

        // figure out this link’s index in each group
        const fromIndex = fromGroup.indexOf(link)
        const toIndex = toGroup.indexOf(link)

        return {
          id: link.id,
          from: [link.sourceNode, edgeKeys[link.sourcePort]] as const,
          to: [link.targetNode, edgeKeys[link.targetPort]] as const,
          offset: {
            from: {
              x: ['top', 'bottom'].includes(edgeKeys[link.sourcePort])
                ? fromOffsets[fromIndex]
                : 0,
              y: ['left', 'right'].includes(edgeKeys[link.sourcePort])
                ? fromOffsets[fromIndex]
                : 0
            },
            to: {
              x: ['top', 'bottom'].includes(edgeKeys[link.targetPort])
                ? toOffsets[toIndex]
                : 0,
              y: ['left', 'right'].includes(edgeKeys[link.targetPort])
                ? toOffsets[toIndex]
                : 0
            }
          }
        }
      })
    }
  )

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
      {connections.map((conn) => (
        <Connection key={conn.id} svgRef={ref} {...conn} />
      ))}
      {/* <DrawPreview
        coords={{
          from: { x: 426, y: 277, edge: 'bottom' },
          to: { x: 540, y: 353, edge: 'left' }
        }}
      /> */}
    </svg>
  )
}

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

  // adjust positions for the SVG BCR and window scrolling
  lineStart.x += window.scrollX - svgBCR.left + offset.from.x
  lineStart.y += window.scrollY - svgBCR.top + offset.from.y

  lineEnd.x += window.scrollX - svgBCR.left + offset.to.x
  lineEnd.y += window.scrollY - svgBCR.top + offset.to.y

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

export default LineSVG
