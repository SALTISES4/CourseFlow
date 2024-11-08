import { CfObjectType } from '@cf/types/enum'
import * as Constants from '@cf/utility/constants'
import { calcWorkflowPermissions } from '@cf/utility/permissions'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
import { AppState, TColumn, TNode, TWorkflow } from '@cfRedux/types/type'
import NodeTitle from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeTitle'
import clsx from 'clsx'
import React, { useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'

type OwnProps = {
  node: TNode
  parentId: number
}

const GridNode: React.FC<OwnProps> = ({ node, parentId }) => {
  const dispatch = useDispatch()
  const column = useSelector((state: AppState) =>
    state.column.find((column) => column.id === node.column)
  )
  const workflow = useSelector((state: AppState) => state.workflow)

  const mainDiv = useRef<HTMLDivElement>(null)
  const manager = useRef(new BetterSelectionManager(dispatch))
  const objectType = CfObjectType.NODE

  const style: React.CSSProperties = {
    backgroundColor: ThemeHelper.getColumnColour({
      columnType: column?.columnType,
      colour: column?.colour
    }),
    outline: node.lock ? `2px solid ${node.lock.userColour}` : undefined
  }

  const permissions = calcWorkflowPermissions(workflow.userPermissions)
  const comments = permissions.read ? <>commentbox placeholder</> : null

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    manager.current.updateSidebar(node.id, objectType, node.id)
  }

  const Ponderation = () => {
    const dataOverride = node.representsWorkflow
      ? { ...node, ...node.linkedWorkflowData, id: node.id }
      : node

    return (
      <div className="grid-ponderation">
        {`${dataOverride.ponderationTheory}/${dataOverride.ponderationPractical}/${dataOverride.ponderationIndividual}`}
      </div>
    )
  }

  return (
    <div
      id={String(node.id)}
      className={clsx(
        `node column-${node.column}`,
        Constants.nodeKeys[node.nodeType],
        node.isDropped && 'dropped',
        node.lock && `locked locked-${node.lock.userId}`
      )}
      style={style}
      ref={mainDiv}
      onClick={handleClick}
    >
      <div className="node-top-row">
        <NodeTitle node={node} />
        <Ponderation />
      </div>
      <div className="mouseover-actions">{comments}</div>
      <div className="side-actions">
        <div className="comment-indicator-container"></div>
      </div>
    </div>
  )
}

export default GridNode

// import { CfObjectType } from '@cf/types/enum'
// import * as Constants from '@cf/utility/constants'
// import { calcWorkflowPermissions } from '@cf/utility/permissions'
// import ThemeHelper from '@cf/utility/ThemeHelper.class'
// import BetterSelectionManager from '@cfRedux/BetterSelectionManager'
// import { AppState, TColumn, TNode, TWorkflow } from '@cfRedux/types/type'
// import NodeTitle from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeTitle'
// import { Dispatch } from '@reduxjs/toolkit'
// import clsx from 'clsx'
// import * as React from 'react'
// import { connect } from 'react-redux'
// import { Action } from 'redux'
//
// type OwnProps = {
//   node: TNode
//   parentId: number
// } & { dispatch?: Dispatch<Action> }
//
// type ConnectedProps = {
//   column: TColumn
//   workflow: TWorkflow
// }
// type PropsType = OwnProps & ConnectedProps
// type StateProps = {}
// /**
//  * A node in the grid view
//  */
// class GridNodeUnconnected extends React.Component<PropsType, StateProps> {
//   private manager: BetterSelectionManager
//   private objectType: CfObjectType
//   private mainDiv: React.RefObject<HTMLDivElement>
//
//   constructor(props: PropsType) {
//     super(props)
//     this.manager = new BetterSelectionManager(this.props.dispatch)
//     this.mainDiv = React.createRef()
//     this.objectType = CfObjectType.NODE
//   }
//
//   Ponderation = () => {
//     const node = this.props.node
//     const dataOverride = node.representsWorkflow
//       ? { ...node, ...node.linkedWorkflowData, id: node.id }
//       : node
//
//     return (
//       <div className="grid-ponderation">
//         {dataOverride.ponderationTheory +
//           '/' +
//           dataOverride.ponderationPractical +
//           '/' +
//           dataOverride.ponderationIndividual}
//       </div>
//     )
//   }
//   /*******************************************************
//    * RENDER
//    *******************************************************/
//   render() {
//     const node = this.props.node
//
//     const style: React.CSSProperties = {
//       backgroundColor: ThemeHelper.getColumnColour({
//         columnType: this.props.column.columnType,
//         colour: this.props.column.colour
//       }),
//       outline: node.lock ? '2px solid ' + node.lock.userColour : undefined
//     }
//
//     const permissions = calcWorkflowPermissions(
//       this.props.workflow.userPermissions
//     )
//     //    const comments = permissions.read ? <AddCommenting /> : ''
//     const comments = permissions.read ? <>commentbox placeholder</> : ''
//
//     //     const portal = this.addEditable(dataOverride, true)
//
//     return (
//       <>
//         {/*{portal}*/}
//         <div
//           id={String(node.id)}
//           className={clsx(
//             `node column-${node.column}`,
//             Constants.nodeKeys[node.nodeType],
//             node.isDropped && 'dropped',
//             node.lock && `locked locked-${node.lock.userId}`
//           )}
//           style={style}
//           ref={this.mainDiv}
//           onClick={(e) => {
//             e.stopPropagation()
//             this.manager.updateSidebar(
//               node.id,
//               this.objectType,
//               this.props.node.id
//             )
//           }}
//         >
//           <div className="node-top-row">
//             <NodeTitle node={node} />
//             <this.Ponderation />
//           </div>
//           <div className="mouseover-actions">{comments}</div>
//           <div className="side-actions">
//             <div className="comment-indicator-container"></div>
//           </div>
//         </div>
//       </>
//     )
//   }
// }
//
// const mapStateToProps = (
//   state: AppState,
//   ownProps: OwnProps
// ): ConnectedProps => ({
//   column: state.column.find((column) => column.id == ownProps.objectId),
//   workflow: state.workflow
// })
// const GridNode = connect<ConnectedProps, object, OwnProps, AppState>(
//   mapStateToProps,
//   null
// )(GridNodeUnconnected)
//
// export default GridNode
