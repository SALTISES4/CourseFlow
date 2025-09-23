import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { selectNodelinkById } from '@cfRedux/selectors/nodelink.selector'
import { RootState } from '@cfRedux/store'
import NodelinkSVG from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodelinkSVG'
import * as d3 from 'd3'
import React, { useCallback, useEffect, useState } from 'react'
import * as reactDom from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'

type PropsType = {
  objectId: number
  nodeDiv: React.MutableRefObject<HTMLElement>
}

const Nodelink = ({ objectId, nodeDiv }: PropsType) => {
  /*******************************************************
   * REDUX
   *******************************************************/
  const dispatch = useDispatch()
  const nodelink = useSelector((state: RootState) =>
    selectNodelinkById(state, objectId)
  )

  /*******************************************************
   * CONSTANTS
   *******************************************************/
  const manager = new BetterSelectionManager(dispatch)
  const objectType = CfObjectType.NODELINK
  const rerenderEvents = `ports-rendered.${objectId}`

  /*******************************************************
   * STATE
   *******************************************************/
  const [sourceNode, setSourceNode] = useState(null)
  const [targetNode, setTargetNode] = useState(null)
  const [sourcePortHandle, setSourcePortHandle] =
    useState<d3.Selection<SVGElement, unknown, HTMLElement, any>>(null)
  const [targetPortHandle, setTargetPortHandle] =
    useState<d3.Selection<SVGElement, unknown, HTMLElement, any>>(null)

  const rerender = useCallback(() => {
    setSourceNode($(nodeDiv.current))
    setTargetNode($(`#node-${nodelink.targetNode}`))
  }, [nodeDiv, nodelink.targetNode])

  /*******************************************************
   * LIFECYCLE HOOKS
   *******************************************************/
  // Effect to handle node updates and event listeners
  useEffect(() => {
    if (!nodelink) {
      return
    }

    const srcNode = $(nodeDiv.current)
    const tgtNode = $(`#node-${nodelink.targetNode}`)

    setSourceNode(srcNode)
    setTargetNode(tgtNode)

    srcNode.on(rerenderEvents, rerender)
    tgtNode.on(rerenderEvents, rerender)

    // this css selector defines the circle attached to each node
    // from which the line is connected
    const sourcePortSelector = [
      `g.port-${nodelink.sourceNode}`,
      ` circle[data-port-type='source']`,
      `[data-port='${Constants.portKeys[nodelink.sourcePort]}']`
    ].join('')

    // this css selector defines the circle attached to each node
    // to which the line is connected
    const targetPortSelector = [
      `g.port-${nodelink.targetNode}`,
      ` circle[data-port-type='target']`,
      `[data-port='${Constants.portKeys[nodelink.targetPort]}']`
    ].join('')

    setSourcePortHandle(d3.select(sourcePortSelector))
    setTargetPortHandle(d3.select(targetPortSelector))

    return () => {
      srcNode.off(rerenderEvents)
      tgtNode.off(rerenderEvents)
    }
  }, [nodelink, nodeDiv, rerenderEvents, rerender])

  /**
   * FUNCTIONS
   **/
  /**
   * This is outside of react, so we need to redraw the nodeLinks manually
   **/

  /**
   * Early exit if dimensions are not available
   **/
  if (
    !sourceNode ||
    !targetNode ||
    !sourcePortHandle ||
    sourcePortHandle.empty()
  ) {
    return null
  }

  const nodeSelected =
    sourceNode.attr('data-selected') === 'true' ||
    targetNode.attr('data-selected') === 'true'

  const nodeHovered =
    sourceNode.attr('data-hovered') === 'true' ||
    targetNode.attr('data-hovered') === 'true'

  /**
   * React Style
   **/
  const style: React.CSSProperties = {}
  if (nodelink.dashed) {
    style.strokeDasharray = '5,5'
  }

  if (
    sourceNode.css('display') === 'none' ||
    targetNode.css('display') === 'none'
  ) {
    style.display = 'none'
  }

  const sourceDims = {
    width: sourceNode.outerWidth(),
    height: sourceNode.outerHeight()
  }

  const targetDims = {
    width: targetNode.outerWidth(),
    height: targetNode.outerHeight()
  }

  if (!sourceDims.width || !targetDims.width) {
    return null
  }

  const portal = reactDom.createPortal(
    <NodelinkSVG
      style={style}
      hovered={nodeHovered}
      nodeSelected={nodeSelected}
      // lock={nodeLink?.lock}
      title={nodelink.title}
      textPosition={nodelink.textPosition}
      sourcePortHandle={sourcePortHandle}
      sourcePort={nodelink.sourcePort}
      targetPortHandle={targetPortHandle}
      targetPort={nodelink.targetPort}
      clickFunction={(e) => {
        e.stopPropagation()
        manager.updateSidebar(nodelink.id, objectType)
      }}
      sourceDimensions={sourceDims}
      targetDimensions={targetDims}
    />,
    $('.workflow-canvas')[0]
  )

  return <>{portal}</>
}

export default Nodelink
