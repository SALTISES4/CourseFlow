import { FieldChoice } from '@cf/types/common'
import { TColumnWorkflowByID, getColumnWorkflowByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import NodeBarColumn from '@cfViews/components/rightSideBarContent/NodeBar/components/NodeBarColumn'
import NodeBarColumnCreator from '@cfViews/components/rightSideBarContent/NodeBar/components/NodeBarColumnCreator'
import * as React from 'react'
import { connect } from 'react-redux'

/**
 * More or less a dummy container which renders
 * the column into itself.
 * We can also have this be a "column creator" which
 * instead CREATES a default column which is currently missing
 */
type SelfProps = {
  objectId?: number
  // parentID?: number / @todo does not seem to be used
  columnType?: number | string
  columnChoices: FieldChoice[] // was from renderer, need to check this, look at column type as well in relation to  NodeBarColumnCreator
}
type ConnectedProps = TColumnWorkflowByID
type PropsType = SelfProps & ConnectedProps
export type NodeBarColumnWorkflowUnconnectedPropsType = PropsType

class NodeBarColumnWorkflowUnconnected extends React.Component<PropsType> {
  /*******************************************************
   * RENDER
   *******************************************************/

  /*******************************************************
   * NodeBarColumn, NodeBarColumnCreator
   * are these same component, but with or without redux
   * don't understand point yet
   *
   *******************************************************/
  render() {
    if (this.props.data)
      return (
        // @todo was
        // <div className="node-bar-column-workflow" ref={this.mainDiv}>
        // however this.mainDiv is not defined in this class
        <div className="node-bar-column-workflow">
          <NodeBarColumn
            objectId={this.props.data.column}
            // throughParentID={this.props.data.id} // @todo does not seem to be used
            // parentID={this.props.parentID} // @todo does not seem to be used
            // renderer={this.props.renderer} // @todo look in renderer for column choices or columnType
          />
        </div>
      )
    else
      return (
        // @todo was
        // <div className="node-bar-column-workflow" ref={this.mainDiv}>
        // however this.mainDiv is not defined in this class
        <div className="node-bar-column-workflow">
          <NodeBarColumnCreator
            columnType={this.props.columnType}
            columnChoices={this.props.columnChoices}
          />
        </div>
      )
  }
}
const mapStateToProps = (
  state: AppState,
  ownProps: SelfProps
): TColumnWorkflowByID => {
  return getColumnWorkflowByID(state, ownProps.objectId)
}

const NodeBarColumnWorkflow = connect<
  ConnectedProps,
  object,
  SelfProps,
  AppState
>(
  mapStateToProps,
  null
)(NodeBarColumnWorkflowUnconnected)

export default NodeBarColumnWorkflow
