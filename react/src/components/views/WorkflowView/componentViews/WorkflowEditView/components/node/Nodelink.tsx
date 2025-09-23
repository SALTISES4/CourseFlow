import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { selectNodeLinkById } from '@cfRedux/selectors/nodelink.selector'
import { AppState } from '@cfRedux/types/type'
import NodeLinkSVG from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeLinkSVG'
import { RootState } from '@cfRedux/store'

import * as d3 from 'd3'
import React, { useCallback, useEffect, useState } from 'react'
import * as reactDom from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'

type PropsType = {
  objectId: number
  nodeDiv: React.MutableRefObject<HTMLElement>
}

const NodeLink = ({ objectId, nodeDiv }: PropsType) => {
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
    setTargetNode($(`#node-${nodeLink.targetNode}`))
  }, [nodeDiv, nodeLink.targetNode])

  /*******************************************************
   * LIFECYCLE HOOKS
   *******************************************************/
  // Effect to handle node updates and event listeners
  useEffect(() => {
    if (!nodelink) {
      return
    }

    const srcNode = $(nodeDiv.current)
    const tgtNode = $(`#node-${nodeLink.targetNode}`)

    setSourceNode(srcNode)
    setTargetNode(tgtNode)

    srcNode.on(rerenderEvents, rerender)
    tgtNode.on(rerenderEvents, rerender)

    // this css selector defines the circle attached to each node
    // from which the line is connected
    const sourcePortSelector = [
      `g.port-${nodeLink.sourceNode}`,
      ` circle[data-port-type='source']`,
      `[data-port='${Constants.portKeys[nodeLink.sourcePort]}']`
    ].join('')

    // this css selector defines the circle attached to each node
    // to which the line is connected
    const targetPortSelector = [
      `g.port-${nodeLink.targetNode}`,
      ` circle[data-port-type='target']`,
      `[data-port='${Constants.portKeys[nodeLink.targetPort]}']`
    ].join('')

    setSourcePortHandle(d3.select(sourcePortSelector))
    setTargetPortHandle(d3.select(targetPortSelector))

    return () => {
      srcNode.off(rerenderEvents)
      tgtNode.off(rerenderEvents)
    }
  }, [nodeLink, nodeDiv, rerenderEvents, rerender])

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
  if (nodeLink.dashed) {
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
    <NodeLinkSVG
      style={style}
      hovered={nodeHovered}
      nodeSelected={nodeSelected}
      // lock={nodeLink?.lock}
      title={nodeLink.title}
      textPosition={nodeLink.textPosition}
      sourcePortHandle={sourcePortHandle}
      sourcePort={nodeLink.sourcePort}
      targetPortHandle={targetPortHandle}
      targetPort={nodeLink.targetPort}
      clickFunction={(e) => {
        e.stopPropagation()
        manager.updateSidebar(nodeLink.id, objectType)
      }}
      sourceDimensions={sourceDims}
      targetDimensions={targetDims}
    />,
    $('.workflow-canvas')[0]
  )

  return <>{portal}</>
}

export default NodeLink

// import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
// import { CfObjectType } from '@cf/types/enum'
// import * as Constants from '@cf/utility/constants'
// import { TGetNodeLinkById, getNodeLinkByID } from '@cfFindState'
// import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
// import { AppState } from '@cfRedux/types/type'
// import NodeLinkSVG from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeLinkSVG'
// import { Dispatch } from '@reduxjs/toolkit'
// import * as React from 'react'
// import * as reactDom from 'react-dom'
// import { connect } from 'react-redux'
// import { Action } from 'redux'
// // import $ from 'jquery'
//
// type ConnectedProps = TGetNodeLinkById
// type OwnProps = {
//   objectId: number
// //  parentId: number @todo no sure ?
//   nodeDiv: React.RefObject<HTMLDivElement>
// } & { dispatch?: Dispatch<Action> }
// type StateProps = {}
// type PropsType = ConnectedProps & OwnProps
//
// /**
//  * The arrow manually drawn between two nodes (as opposed to the
//  * autolink which is automatically drawn). This can have text added.
//  */
// class NodeLink extends React.Component<PropsType, StateProps> {
//   static contextType = WorkflowConfigContext
//   declare context: React.ContextType<typeof WorkflowConfigContext>
//
//   private sourceNode: JQuery
//   private targetNode: JQuery
//   private targetPortHandle: d3.Selection<SVGElement, unknown, HTMLElement, any>
//   private sourcePortHandle: d3.Selection<SVGElement, unknown, HTMLElement, any>
//   private rerenderEvents: string
//   private manager: BetterSelectionManager
//   private objectType: CfObjectType
//
//   constructor(props: PropsType) {
//     super(props)
//     this.manager = new BetterSelectionManager(this.props.dispatch)
//     this.objectType = CfObjectType.NODELINK
//     this.rerenderEvents = 'ports-rendered.' + this.props.nodeLink.id
//   }
//
//   /*******************************************************
//    * LIFECYCLE
//    *******************************************************/
//   componentWillUnmount() {
//     if (this.targetNode && this.targetNode.length > 0) {
//       this.sourceNode.off(this.rerenderEvents)
//       this.targetNode.off(this.rerenderEvents)
//     }
//   }
//
//   /*******************************************************
//    * FUNCTIONS
//    *******************************************************/
//   // what
//   rerender() {
//     this.setState({})
//   }
//
//   /*******************************************************
//    * RENDER
//    *******************************************************/
//   render() {
//     const data = this.props.data
//     const style: React.CSSProperties = {}
//
//     if (
//       !this.sourceNode ||
//       !this.sourceNode.outerWidth() ||
//       !this.targetNode ||
//       !this.targetNode.outerWidth() ||
//       !this.targetPortHandle ||
//       this.targetPortHandle.empty()
//     ) {
//       this.sourceNode = $(this.props.nodeDiv.current)
//       this.targetNode = $('#' + nodeLink.targetNode + '.node')
//
//       this.sourceNode.on(this.rerenderEvents, this.rerender.bind(this))
//       this.targetNode.on(this.rerenderEvents, this.rerender.bind(this))
//
//       // this css selector defines the circle attached to each node
//       // from which the line is connected
//       const cssSourcePortSelector = [
//         `g.port-${nodeLink.sourceNode}`,
//         ` circle[data-port-type='source']`,
//         `[data-port='${Constants.portKeys[nodeLink.sourcePort]}']`
//       ].join('')
//
//       // Utility.logger('cssSourcePortSelector')
//       // Utility.logger(cssSourcePortSelector)
//
//       // this css selector defines the circle attached to each node
//       // to which the line is connected
//       const cssSourceTargetSelector = [
//         `g.port-${nodeLink.targetNode} `,
//         ` circle[data-port-type='target']`,
//         `[data-port='${Constants.portKeys[nodeLink.targetPort]}']`
//       ].join('')
//
//       this.sourcePortHandle = d3.select(cssSourcePortSelector)
//       this.targetPortHandle = d3.select(cssSourceTargetSelector)
//     }
//
//     const nodeSelected =
//       this.sourceNode.attr('data-selected') === 'true' ||
//       this.targetNode.attr('data-selected') === 'true'
//     const nodeHovered =
//       this.sourceNode.attr('data-hovered') === 'true' ||
//       this.targetNode.attr('data-hovered') === 'true'
//
//     if (nodeLink.dashed) {
//       style.strokeDasharray = '5,5'
//     }
//
//     if (
//       this.sourceNode.css('display') == 'none' ||
//       this.targetNode.css('display') == 'none'
//     ) {
//       style.display = 'none'
//     }
//
//     const sourceDims = {
//       width: this.sourceNode.outerWidth(),
//       height: this.sourceNode.outerHeight()
//     }
//
//     const targetDims = {
//       width: this.targetNode.outerWidth(),
//       height: this.targetNode.outerHeight()
//     }
//
//     if (!sourceDims.width || !targetDims.width) {
//       return null
//     }
//
//     if (!this.sourceNode.is(':visible') || !this.targetNode.is(':visible')) {
//       return null
//     }
//
//     // PORTAL
//     /**
//      *    this is dynamic see: react/src/components/views/WorkflowView/WorkflowView.tsx
//      *    for where this target is attached to the page
//      **/
//     const portal = reactDom.createPortal(
//       <NodeLinkSVG
//         style={style}
//         hovered={nodeHovered}
//         nodeSelected={nodeSelected}
//         lock={nodeLink.lock} // @todo where is lock defined?
//         title={nodeLink.title}
//         textPosition={nodeLink.textPosition}
//         sourcePortHandle={this.sourcePortHandle}
//         sourcePort={nodeLink.sourcePort}
//         targetPortHandle={this.targetPortHandle}
//         targetPort={nodeLink.targetPort}
//         clickFunction={(e) => {
//           e.stopPropagation()
//           this.manager.updateSidebar(
//             nodeLink.id,
//             this.objectType,
//             this.props.parentId
//           )
//         }}
//         // selected={this.state.selected}
//         sourceDimensions={sourceDims}
//         targetDimensions={targetDims}
//       />,
//
//       $('.workflow-canvas')[0]
//     )
//
//     return (
//       <>
//         {portal}
//         {/*{this.addEditable(data)}*/}
//       </>
//     )
//   }
// }
// const mapStateToProps = (
//   state: AppState,
//   ownProps: OwnProps
// ): TGetNodeLinkById => {
//   return getNodeLinkByID(state, ownProps.objectId) || { data: undefined }
// }
// export default connect<ConnectedProps, object, OwnProps, AppState>(
//   mapStateToProps,
//   null
// )(NodeLink)
