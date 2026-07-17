import {
  selectEdgesByGraphUuid,
  selectNodeUuidsByGraphUuid
} from '@cf/features/graph/state/selectors/canonical.selectors'
import { RootState } from '@cf/redux/store'
import { CfObjectType } from '@cf/types/enum'
import {
  RefObject,
  memo,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useSelector } from 'react-redux'

import Connection from './Connection'
import ConnectionDrawPreview, { NodeBCR } from './DrawPreview'
import * as Styled from './styles'
import { ConnectionType } from './types'
import { canonicalPortToConnectionEdge, edgeLineTypeIsDashed } from './utility'

const LineSVG = ({
  graphUuid,
  rerender,
  condensed
}: {
  graphUuid: string
  rerender: boolean
  condensed: number
}) => {
  const ref = useRef<SVGSVGElement>(null)

  const edgesSelector = useMemo(
    () => selectEdgesByGraphUuid(graphUuid),
    [graphUuid]
  )
  const nodeUuidsSelector = useMemo(
    () => selectNodeUuidsByGraphUuid(graphUuid),
    [graphUuid]
  )

  const edges = useSelector(edgesSelector)
  const nodeUuids = useSelector(nodeUuidsSelector)

  const [nodesBCR, setNodesBCR] = useState<Record<string, NodeBCR>>({})

  const selectedEdgeUuid = useSelector((state: RootState) =>
    state.sidebar.edit.objectType === CfObjectType.EDGE &&
    state.sidebar.edit.uuid
      ? state.sidebar.edit.uuid
      : null
  )

  const connections: ConnectionType[] = useMemo(
    () =>
      edges.map((edge) => ({
        uuid: edge.edgeId,
        dashed: edgeLineTypeIsDashed(edge.lineType),
        fromId: edge.sourceNodeUuid,
        fromEdge: canonicalPortToConnectionEdge(edge.sourcePort),
        toId: edge.targetNodeUuid,
        toEdge: canonicalPortToConnectionEdge(edge.targetPort)
      })),
    [edges]
  )

  // wait for DOM to render before querying it for node BCRs
  // but adjusted for SVG offsets to give SVG relative coordinates
  useLayoutEffect(() => {
    const results: Record<string, NodeBCR> = {}
    if (!ref.current) {
      return
    }

    const svgBCR = ref.current.getBoundingClientRect()

    nodeUuids.forEach((nodeUuid) => {
      const node = document.getElementById(`node-${nodeUuid}`)
      if (node) {
        const bcr = node.getBoundingClientRect()
        const x = bcr.x - svgBCR.left
        const y = bcr.y - svgBCR.top

        results[nodeUuid] = {
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
  }, [rerender, condensed, nodeUuids, edges])

  return (
    <>
      <BottomSVG
        svgRef={ref}
        connections={connections}
        selectedEdgeUuid={selectedEdgeUuid}
      />
      <TopSVG
        nodesBCR={nodesBCR}
        connection={connections.find((c) => c.uuid === selectedEdgeUuid)}
      />
    </>
  )
}

const BottomSVG = ({
  svgRef,
  connections,
  selectedEdgeUuid
}: {
  svgRef: RefObject<SVGSVGElement>
  connections: ConnectionType[]
  selectedEdgeUuid: string | null
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
        if (conn.uuid !== selectedEdgeUuid) {
          return <Connection key={conn.uuid} svgRef={svgRef} {...conn} />
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
    nodesBCR: Record<string, NodeBCR>
    connection: ConnectionType | undefined
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
