// @ts-nocheck
import * as React from 'react'
import { connect } from 'react-redux'
import { getNodeWeekByID } from '@cfFindState'
// @local
import Node from './Node'
import { AppState } from '@cfRedux/type'
import { NodeWeekUnconnected } from '@cfViews/WorkflowView/NodeWeek'

type ConnectedProps = any
type OwnProps = any
type StateProps = any
type PropsType = ConnectedProps & OwnProps

/**
 * NodeWeek for the comparison view
 */
class NodeWeekComparisonUnconnected extends NodeWeekUnconnected {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getNode() {
    const data = this.props.data
    return (
      <Node
        objectID={data.node}
        parentID={this.props.parentID}
        throughParentID={data.id}
        renderer={this.props.renderer}
        column_order={this.props.column_order}
      />
    )
  }
}
const mapNodeWeekStateToProps = (state: AppState, ownProps: OwnProps) => {
  return getNodeWeekByID(state, ownProps.objectID)
}
const NodeWeekComparison = connect<ConnectedProps, object, OwnProps, AppState>(
  mapNodeWeekStateToProps,
  null
)(NodeWeekComparisonUnconnected)

export default NodeWeekComparison
