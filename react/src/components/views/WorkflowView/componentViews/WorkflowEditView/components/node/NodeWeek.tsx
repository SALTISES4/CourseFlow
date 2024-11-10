import { getNodeWeekByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import Node from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/Node'
import clsx from 'clsx'
import React from 'react'
import { useSelector } from 'react-redux'

type PropsType = {
  objectId: number
  parentId: number
  columnOrder: any
}

const NodeWeek = ({ objectId, parentId, columnOrder }: PropsType) => {
  const data = useSelector((state: AppState) =>
    getNodeWeekByID(state, objectId)
  )

  const newData = data?.data
  if (!newData) {
    return null
  }

  return (
    <div
      className={clsx('node-week', { 'no-drag': newData.noDrag })}
      id={String(newData.id)}
      data-child-id={String(newData.node)}
      data-column-id={String(data.column)}
    >
      <Node
        objectId={newData.node}
        parentId={parentId}
        throughParentId={newData.id}
        columnOrder={columnOrder}
      />
    </div>
  )
}

export default NodeWeek

// import { TGetNodeWeekById, getNodeWeekByID } from '@cfFindState'
// import { AppState } from '@cfRedux/types/type'
// import Node from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/Node'
// import clsx from 'clsx'
// import * as React from 'react'
// import { connect } from 'react-redux'
//
// type ConnectedProps = TGetNodeWeekById
//
// type OwnProps = {
//   objectId: number
//   parentId: number
//   columnOrder: any
// }
//
// type PropsType = ConnectedProps & OwnProps
//
// /**
//  * Represents the node-week throughmodel
//  * this should not exist...
//  */
// class NodeWeekUnconnected<P extends PropsType> extends React.Component<P> {
//   constructor(props) {
//     super(props)
//   }
//
//   /*******************************************************
//    * RENDER
//    *******************************************************/
//   render() {
//     const data = this.props.data
//
//     return (
//       <div
//         className={clsx('node-week', {
//           'no-drag': data.noDrag
//         })}
//         id={data.id}
//         data-child-id={data.node}
//         data-column-id={this.props.column}
//       >
//         <Node
//           objectId={data.node}
//           parentId={this.props.parentId}
//           throughParentId={data.id}
//           columnOrder={this.props.columnOrder}
//         />
//       </div>
//     )
//   }
// }
// const mapStateToProps = (
//   state: AppState,
//   ownProps: OwnProps
// ): TGetNodeWeekById => {
//   return getNodeWeekByID(state, ownProps.objectId)
// }
// const NodeWeek = connect<ConnectedProps, object, OwnProps, AppState>(
//   mapStateToProps,
//   null
// )(NodeWeekUnconnected)
// export default NodeWeek
//
// export { NodeWeekUnconnected }
