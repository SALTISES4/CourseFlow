import { RootState } from '@cf/redux/store'
import { selectActiveLinks } from '@cfRedux/selectors/nodelink.selector'
import { memo, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import Connection from './Connection'
import ConnectionDrawPreview from './DrawPreview'
import { edgeKeys } from './types'
import { ConnectionType } from './types'
import { generateOffsets, groupLinksByNodeEdge } from './utility'

const LineSVG = ({ rerender }: { rerender: boolean }) => {
  const ref = useRef<SVGSVGElement>(null)
  const nodes = useSelector((state: RootState) => state.workspace.node.ids)
  const [nodesBCR, setNodesBCR] = useState<Record<number, DOMRect>>({})

  // wait for DOM to render before querying it for node BCRs
  useLayoutEffect(() => {
    const results: Record<number, DOMRect> = {}

    nodes.forEach((nodeId) => {
      const node = document.getElementById(`node-${nodeId}`)
      if (node) {
        results[nodeId] = node.getBoundingClientRect()
      }
    })

    setNodesBCR(results)
  }, [nodes])

  // grab all the non-deleted links
  const links = useSelector(selectActiveLinks)

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
      <ConnectionDrawPreview svgRef={ref} nodesBCR={nodesBCR} />
    </svg>
  )
}

export default memo(LineSVG)
