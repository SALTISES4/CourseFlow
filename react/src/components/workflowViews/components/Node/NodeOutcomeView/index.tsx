import * as React from 'react'
import { connect } from 'react-redux'
import * as Constants from '@cfConstants'
import { getNodeByID, TGetNodeByID } from '@cfFindState'
import { NodeTitle } from '@cfCommonComponents/UIComponents/Titles'
import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfEditableComponents/ComponentWithToggleDrop'
import { AppState } from '@cfRedux/types/type'
import { CfObjectType } from '@cfModule/types/enum'

/**
 *  Basic component to represent a node in the outcomes table
 *
 */

type ConnectedProps = TGetNodeByID
type OwnProps = ComponentWithToggleProps

type PropsType = ConnectedProps & OwnProps
// type StateType = {
//   initialRender: boolean
// }
/**
 *
 */
class NodeOutcomeViewUnconnected extends ComponentWithToggleDrop<PropsType> {
  // StateType
  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.NODE
    // this.state = {
    //   initialRender: true
    // }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data

    // @todo these vars not used
    // const data_override = data.represents_workflow
    //   ? { ...data, ...data.linked_workflow_data, id: data.id }
    //   : data
    // const selection_manager = this.props.renderer.selection_manager

    const style: React.CSSProperties = {
      backgroundColor: Constants.getColumnColour(this.props.column)
    }
    const cssClasses = [
      'node column-' + data.column + ' ' + Constants.node_keys[data.node_type],
      data.is_dropped ? 'dropped' : '',
      // @ts-ignore
      data.lock ? 'locked locked-' + data.lock.user_id : '' // @todo it seems like data.lock will never be defined, verify this
    ].join(' ')

    // let comments // @todo verify,  comments is never defined

    return (
      <div ref={this.mainDiv} className="table-cell nodewrapper">
        <div className={cssClasses} style={style} id={String(data.id)}>
          <div className="node-top-row">
            <NodeTitle data={data} />
          </div>
          {/*
          // @todo verify,  comments is never defined
          <div className="mouseover-actions">{comments}</div>
          */}
        </div>
        <div className="side-actions">
          <div className="comment-indicator-container" />
        </div>
      </div>
    )
  }
}
const mapNodeStateToProps = (
  state: AppState,
  ownProps: OwnProps
): TGetNodeByID => {
  return getNodeByID(state, ownProps.objectID)
}
const NodeOutcomeView = connect<ConnectedProps, object, OwnProps, AppState>(
  mapNodeStateToProps,
  null
)(NodeOutcomeViewUnconnected)

export default NodeOutcomeView
