import { RootState } from '@cf/redux/store'
import { CfObjectType } from '@cf/types/enum'
import { selectActiveLinks } from '@cfRedux/selectors/nodelink.selector'
import {
  MutableRefObject,
  memo,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useSelector } from 'react-redux'

import Connection from './Connection'
import ConnectionDrawPreview from './DrawPreview'
import * as Styled from './styles'
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

const LineSVG = ({
  rerender,
  condensed
}: {
  rerender: boolean
  condensed: number
}) => {
  const ref = useRef<SVGSVGElement>(null)
  const nodelinks = useSelector(
    (state: RootState) => state.workspace.nodelink.ids
  )
  const links = useSelector(selectActiveLinks)
  const nodes = useSelector((state: RootState) => state.workspace.node.ids)
  const [nodesBCR, setNodesBCR] = useState<Record<number, NodeBCR>>({})

  const selectedLinkId = useSelector(
    (state: RootState) =>
      state.sidebar.edit.objectType === CfObjectType.NODELINK &&
      state.sidebar.edit.id
  )

  const connections: ConnectionType[] = useMemo(
    () =>
      links.map((link) => ({
        id: link.id,
        dashed: link.dashed,
        fromId: link.sourceNode,
        fromEdge: edgeKeys[link.sourcePort],
        toId: link.targetNode,
        toEdge: edgeKeys[link.targetPort]
      })),
    [links]
  )

  // wait for DOM to render before querying it for node BCRs
  // but adjusted for SVG offsets to give SVG relative coordinates
  useLayoutEffect(() => {
    const results: Record<number, NodeBCR> = {}
    if (!ref.current) {
      return
    }

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
  }, [rerender, condensed, nodes, nodelinks])

  return (
    <>
      <BottomSVG
        svgRef={ref}
        connections={connections}
        selectedLinkId={selectedLinkId}
      />
      <TopSVG
        nodesBCR={nodesBCR}
        connection={connections.find((c) => c.id === selectedLinkId)}
      />
    </>
  )
}

const BottomSVG = ({
  svgRef,
  connections,
  selectedLinkId
}: {
  svgRef: MutableRefObject<SVGSVGElement>
  connections: ConnectionType[]
  selectedLinkId: number | null
}) => {
  return (
    <Styled.BottomSVG id="line-svg" ref={svgRef}>
      <defs>
        <marker
          id="line-arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
        </marker>
      </defs>
      {connections.map((conn) => {
        if (conn.id !== selectedLinkId) {
          return <Connection key={conn.id} svgRef={svgRef} {...conn} />
        }
        return null
      })}
    </Styled.BottomSVG>
  )
}

const TopSVG = memo(
  ({
    nodesBCR,
    connection
  }: {
    nodesBCR: Record<number, NodeBCR>
    connection: ConnectionType | null
  }) => {
    const ref = useRef<SVGSVGElement>(null)
    return (
      <Styled.TopSVG ref={ref}>
        <ConnectionDrawPreview nodesBCR={nodesBCR} />
        {connection && <Connection svgRef={ref} {...connection} />}
      </Styled.TopSVG>
    )
  }
)

export default LineSVG
