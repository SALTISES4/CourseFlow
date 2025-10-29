import { RootState } from '@cf/redux/store'
import { selectActiveLinks } from '@cfRedux/selectors/nodelink.selector'
import { memo, useLayoutEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import Connection from './Connection'
import ConnectionDrawPreview from './DrawPreview'
import { edgeKeys } from './types'
import { ConnectionType } from './types'

export type NodeBCR = {
  x: number
  y: number
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
}

const LineSVG = ({ rerender }: { rerender: boolean }) => {
  const ref = useRef<SVGSVGElement>(null)
  const nodelinks = useSelector(
    (state: RootState) => state.workspace.nodelink.ids
  )
  const links = useSelector(selectActiveLinks)
  const nodes = useSelector((state: RootState) => state.workspace.node.ids)
  const [nodesBCR, setNodesBCR] = useState<Record<number, NodeBCR>>({})

  // wait for DOM to render before querying it for node BCRs
  // but adjusted for SVG offsets to give SVG relative coordinates
  useLayoutEffect(() => {
    const results: Record<number, NodeBCR> = {}
    const svgBCR = ref.current.getBoundingClientRect()

    nodes.forEach((nodeId) => {
      const node = document.getElementById(`node-${nodeId}`)
      if (node) {
        const bcr = node.getBoundingClientRect()
        const x = bcr.x - svgBCR.left
        const y = bcr.y - svgBCR.top

        results[nodeId] = {
          x,
          y,
          width: bcr.width,
          height: bcr.height,
          left: x,
          right: x + bcr.width,
          top: y,
          bottom: y + bcr.height
        }
      }
    })

    setNodesBCR(results)
  }, [rerender, nodes, nodelinks])

  const connections: ConnectionType[] = links.map((link) => ({
    id: link.id,
    from: [link.sourceNode, edgeKeys[link.sourcePort]] as const,
    to: [link.targetNode, edgeKeys[link.targetPort]] as const
  }))

  return (
    <svg
      id="line-svg"
      ref={ref}
      style={{
        position: 'absolute',
        top: '-30px',
        left: '-30px',
        width: 'calc(100% + 60px)',
        height: 'calc(100% + 60px)',
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
      <ConnectionDrawPreview nodesBCR={nodesBCR} />
    </svg>
  )
}

export default memo(LineSVG)
