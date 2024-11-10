import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import { getNodeLinkByID } from '@cfFindState'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { AppState } from '@cfRedux/types/type'
import NodeLinkSVG from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeLinkSVG'
import React, { useContext, useEffect, useRef, useState } from 'react'
import * as reactDom from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'

type OwnProps = {
  objectId: number
  nodeDiv: React.RefObject<HTMLDivElement>
}

const NodeLink: React.FC<OwnProps> = ({ objectId, nodeDiv }) => {
  /*******************************************************
   * REDUX
   *******************************************************/
  const dispatch = useDispatch()
  const data = useSelector(
    (state: AppState) => getNodeLinkByID(state, objectId)?.data
  )

  /*******************************************************
   * CONSTANTS
   *******************************************************/
  const manager = new BetterSelectionManager(dispatch)
  const objectType = CfObjectType.NODELINK
  const rerenderEvents = `ports-rendered.${data?.id}`

  /*******************************************************
   * STATE
   *******************************************************/
  const [sourceNode, setSourceNode] = useState<JQuery>(null)
  const [targetNode, setTargetNode] = useState<JQuery>(null)
  const [sourcePortHandle, setSourcePortHandle] =
    useState<d3.Selection<SVGElement, unknown, HTMLElement, any>>(null)
  const [targetPortHandle, setTargetPortHandle] =
    useState<d3.Selection<SVGElement, unknown, HTMLElement, any>>(null)

  /*******************************************************
   * LIFECYCLE HOOKS
   *******************************************************/
  // Effect to handle node updates and event listeners
  useEffect(() => {
    if (!data) {
      return
    }

    const srcNode = $(nodeDiv.current)
    const tgtNode = $(`#${data.targetNode}.node`)

    setSourceNode(srcNode)
    setTargetNode(tgtNode)

    srcNode.on(rerenderEvents, rerender)
    tgtNode.on(rerenderEvents, rerender)

    // this css selector defines the circle attached to each node
    // from which the line is connected
    const sourcePortSelector = [
      `g.port-${data.sourceNode}`,
      ` circle[data-port-type='source']`,
      `[data-port='${Constants.portKeys[data.sourcePort]}']`
    ].join('')

    // this css selector defines the circle attached to each node
    // to which the line is connected
    const targetPortSelector = [
      `g.port-${data.targetNode}`,
      ` circle[data-port-type='target']`,
      `[data-port='${Constants.portKeys[data.targetPort]}']`
    ].join('')

    setSourcePortHandle(d3.select(sourcePortSelector))
    setTargetPortHandle(d3.select(targetPortSelector))

    return () => {
      srcNode.off(rerenderEvents)
      tgtNode.off(rerenderEvents)
    }
  }, [data, nodeDiv])

  /**
   * FUNCTIONS
   **/
  /**
   * This is outside of react, so we need to redraw the nodeLinks manually
   **/
  const rerender = () => {
    setSourceNode($(nodeDiv.current))
    setTargetNode($(`#${data.targetNode}.node`))
  }

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
  if (data.dashed) {
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
      lock={data.lock}
      title={data.title}
      textPosition={data.textPosition}
      sourcePortHandle={sourcePortHandle}
      sourcePort={data.sourcePort}
      targetPortHandle={targetPortHandle}
      targetPort={data.targetPort}
      clickFunction={(e) => {
        e.stopPropagation()
        manager.updateSidebar(data.id, objectType)
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
//     this.rerenderEvents = 'ports-rendered.' + this.props.data.id
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
//       this.targetNode = $('#' + data.targetNode + '.node')
//
//       this.sourceNode.on(this.rerenderEvents, this.rerender.bind(this))
//       this.targetNode.on(this.rerenderEvents, this.rerender.bind(this))
//
//       // this css selector defines the circle attached to each node
//       // from which the line is connected
//       const cssSourcePortSelector = [
//         `g.port-${data.sourceNode}`,
//         ` circle[data-port-type='source']`,
//         `[data-port='${Constants.portKeys[data.sourcePort]}']`
//       ].join('')
//
//       // Utility.logger('cssSourcePortSelector')
//       // Utility.logger(cssSourcePortSelector)
//
//       // this css selector defines the circle attached to each node
//       // to which the line is connected
//       const cssSourceTargetSelector = [
//         `g.port-${data.targetNode} `,
//         ` circle[data-port-type='target']`,
//         `[data-port='${Constants.portKeys[data.targetPort]}']`
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
//     if (data.dashed) {
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
//         lock={data.lock} // @todo where is lock defined?
//         title={data.title}
//         textPosition={data.textPosition}
//         sourcePortHandle={this.sourcePortHandle}
//         sourcePort={data.sourcePort}
//         targetPortHandle={this.targetPortHandle}
//         targetPort={data.targetPort}
//         clickFunction={(e) => {
//           e.stopPropagation()
//           this.manager.updateSidebar(
//             data.id,
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
