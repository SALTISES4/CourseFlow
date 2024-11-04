import * as Constants from '@cf/constants'
import { _t } from '@cf/utility/utilityFunctions'
import { NodeTitle } from '@cfComponents/UIPrimitives/Titles'
import { TGetNodeById, getNodeByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import * as React from 'react'
import { useRef } from 'react'
import { useSelector } from 'react-redux'

type PropsType = {
  objectId?: number
}

// first off, another naming mistake
// django calls this an outcomenode
// second, react representations of the join tables should not exist at all
// while this does reference 'node' data via getNodeByID
// it doesn't render a node
// and w/ is the difference between this and outcomenode?
const NodeOutcomeView = ({ objectId }: PropsType) => {
  //  const objectType = CfObjectType.NODE

  const mainDiv = useRef<HTMLDivElement>(null)
  const node = useSelector<AppState, TGetNodeById>((state: AppState) =>
    getNodeByID(state, objectId)
  )

  const style: React.CSSProperties = {
    backgroundColor: Constants.getColumnColour(node.data.column)
  }

  const cssClasses = [
    'node column-' +
      node.data.column +
      ' ' +
      Constants.nodeKeys[node.data.nodeType],
    node.data.isDropped ? 'dropped' : '',
    node.data.lock ? 'locked locked-' + node.data.lock.userId : ''
  ].join(' ')

  return (
    <div ref={mainDiv} className="table-cell nodewrapper">
      <div className={cssClasses} style={style} id={String(node.data.id)}>
        <div className="node-top-row">
          <NodeTitle data={node.data} />
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
//       backgroundColor: Constants.getColumnColour(this.props.column)
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
