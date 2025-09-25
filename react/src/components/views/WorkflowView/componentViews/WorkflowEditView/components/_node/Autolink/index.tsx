import NodelinkSVG from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/_node/NodelinkSVG'
import * as d3 from 'd3'
import React, { useEffect, useState } from 'react'
import * as reactDom from 'react-dom'

type PropsType = {
  nodeId: number
  nodeDiv: React.RefObject<HTMLElement>
}

const Index = ({ nodeId, nodeDiv }: PropsType) => {
  /*******************************************************
   * CONSTANT
   *******************************************************/
  const eventNameSpace = `autolink${nodeId}`
  const rerenderEvents = `ports-rendered.${eventNameSpace}`

  /*******************************************************
   * STATE
   *******************************************************/
  const [sourceNode, setSourceNode] = useState<JQuery<HTMLElement>>(null)
  const [targetNode, setTargetNode] = useState<JQuery<HTMLElement>>(null)
  const [sourcePortHandle, setSourcePortHandle] =
    useState<d3.Selection<SVGElement, unknown, HTMLElement, any>>(null)
  const [targetPortHandle, setTargetPortHandle] =
    useState<d3.Selection<SVGElement, unknown, HTMLElement, any>>(null)

  /*******************************************************
   * LIFECYCLE HOOKS
   *******************************************************/
  useEffect(() => {
    const srcNode = $(nodeDiv.current)
    setSourceNode(srcNode)

    setSourcePortHandle(
      d3.select(
        `g.port-${nodeId} circle[data-port-type='source'][data-port='s']`
      )
    )

    srcNode.on(rerenderEvents, rerender)

    return () => {
      srcNode.off(rerenderEvents)
    }
  }, [nodeDiv, nodeId])

  useEffect(() => {
    if (!sourceNode) {
      return
    }

    findAutoTarget()

    return () => {
      if (targetNode) {
        targetNode.off(rerenderEvents)
      }
    }
  }, [sourceNode, targetNode])

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  const rerender = () => {
    setSourceNode($(nodeDiv.current))
  }

  const findAutoTarget = () => {
    const ns = sourceNode.closest('.node-week')
    const nextNs = ns
      .nextAll('.node-week:not(.ui-sortable-placeholder)')
      .first()

    let target = nextNs.length > 0 ? nextNs.find('.node').attr('id') : null

    if (!target) {
      let nextSw = ns.closest('.week-workflow').next()
      while (nextSw.length > 0 && !target) {
        target = nextSw
          .find('.node-week:not(.ui-sortable-placeholder) .node')
          .attr('id')
        nextSw = nextSw.next()
      }
    }

    setTarget(target)
  }

  /**
   *  set the target node and port handle
   **/
  const setTarget = (target: string) => {
    if (target) {
      const tgtNode = $(`#node-${target}`)

      if (targetNode) {
        targetNode.off(rerenderEvents)
      }

      setTargetNode(tgtNode)
      setTargetPortHandle(
        d3.select(
          `g.port-${target} circle[data-port-type='target'][data-port='n']`
        )
      )

      tgtNode.on(rerenderEvents, rerender)
    } else {
      if (targetNode) {
        targetNode.off(rerenderEvents)
      }

      setTargetNode(null)
      setTargetPortHandle(null)
    }
  }

  /**
   * if source or target is not properly set
   **/
  if (
    !sourceNode ||
    !sourcePortHandle ||
    sourcePortHandle.empty() ||
    !targetNode
  ) {
    return null
  }

  /**
   * is the target node is still in the DOM
   **/
  if (targetNode && targetNode.parent().parent().length === 0) {
    setTargetNode(null)
  }

  /*******************************************************
   * RENDER PORTAL
   *******************************************************/
  const sourceDims = {
    width: sourceNode.outerWidth(),
    height: sourceNode.outerHeight()
  }

  const targetDims = {
    width: targetNode.outerWidth(),
    height: targetNode.outerHeight()
  }

  const nodeSelected =
    sourceNode.attr('data-selected') === 'true' ||
    targetNode.attr('data-selected') === 'true'
  const nodeHovered =
    sourceNode.attr('data-hovered') === 'true' ||
    targetNode.attr('data-hovered') === 'true'

  // Create the portal for NodeLinkSVG
  const portal = reactDom.createPortal(
    <NodelinkSVG
      hovered={nodeHovered}
      nodeSelected={nodeSelected}
      sourcePortHandle={sourcePortHandle}
      sourcePort={2}
      targetPortHandle={targetPortHandle}
      targetPort={0}
      sourceDimensions={sourceDims}
      targetDimensions={targetDims}
    />,
    $('.workflow-canvas')[0]
  )

  return <>{portal}</>
}

export default Index
