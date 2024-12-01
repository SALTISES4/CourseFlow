import * as Constants from '@cf/utility/constants'
import ThemeHelper from '@cf/utility/ThemeHelper.class'
import { selectNodeById } from '@cfRedux/selectors/node.selector'
import { RootState } from '@cfRedux/store'
import { AppState } from '@cfRedux/types/type'
import NodeTitle from '@cfViews/WorkflowView/componentViews/WorkflowEditView/components/node/NodeTitle'
import clsx from 'clsx'
import * as React from 'react'
import { useRef } from 'react'
import { useSelector } from 'react-redux'

type PropsType = {
  objectId?: number
}

// 1. naming mistake: django calls this an outcomenode
// 2. React representations of the join tables should not exist at all
//    while this does reference 'node' data via getNodeByID
//    it doesn't render a node
//    and w/ is the difference between this and outcomenode?
const NodeOutcomeView = ({ objectId }: PropsType) => {
  const mainDiv = useRef<HTMLDivElement>(null)
  const node = useSelector((state: RootState) =>
    selectNodeById(state, objectId)
  )

  const style: React.CSSProperties = {
    backgroundColor: ThemeHelper.getColumnColour({
      columnType: node.data.column,
      colour: 1
    })
  }

  return (
    <div ref={mainDiv} className="table-cell nodewrapper">
      <div
        className={clsx(
          'node',
          `column-${node.data.column}`,
          `${Constants.nodeKeys[node.data.nodeType]}`,
          {
            dropped: node.data.isDropped,
            [`locked locked-${node.data.lock.userId}`]: node.data.lock
          }
        )}
        style={style}
        id={String(node.data.id)}
      >
        <div className="node-top-row">
          <NodeTitle node={node.data} />
        </div>
      </div>

      {/* PORTAL PLACEHOLDER TARGET FOR COMMENTBOX */}
      <div className="side-actions">
        <div className="comment-indicator-container" />
      </div>
    </div>
  )
}

export default NodeOutcomeView

/**
 *  Basic component to represent a node in the outcomes table
 *
 */
// type ConnectedProps = TGetNodeById
// type OwnProps = {
//   objectId?: number
// }
//
// type PropsType = ConnectedProps & OwnProps
//
// /**
//  *
//  */
// class NodeOutcomeViewUnconnected extends React.Component<PropsType> {
//   objectType: CfObjectType
//   mainDiv: React.RefObject<HTMLDivElement>
//   constructor(props: PropsType) {
//     super(props)
//     this.mainDiv = React.createRef()
//
//     this.objectType = CfObjectType.NODE
//   }
//
//   /*******************************************************
//    * RENDER
//    *******************************************************/
//   render() {
//     const data = this.props.data
//
//     const style: React.CSSProperties = {
//       backgroundColor: ThemeHelper.gerColumnColour(this.props.column)
//     }
//     const cssClasses = [
//       'node column-' + data.column + ' ' + Constants.nodeKeys[data.nodeType],
//       data.isDropped ? 'dropped' : '',
//       // @ts-ignore
//       data.lock ? 'locked locked-' + data.lock.userId : '' // @todo it seems like data.lock will never be defined, verify this
//     ].join(' ')
//
//     return (
//       <div ref={this.mainDiv} className="table-cell nodewrapper">
//         <div className={cssClasses} style={style} id={String(data.id)}>
//           <div className="node-top-row">
//             <NodeTitle data={data} />
//           </div>
//         </div>
//
//         {/*
//          PORTAL PLACEHOLDER TARGET FOR COMMENTBOX
//         */}
//         <div className="side-actions">
//           <div className="comment-indicator-container" />
//         </div>
//       </div>
//     )
//   }
// }
// const mapNodeStateToProps = (
//   state: AppState,
//   ownProps: OwnProps
// ): TGetNodeById => {
//   return getNodeByID(state, ownProps.objectId)
// }
// const NodeOutcomeView = connect<ConnectedProps, object, OwnProps, AppState>(
//   mapNodeStateToProps,
//   null
// )(NodeOutcomeViewUnconnected)
//
// export default NodeOutcomeView
