// @ts-nocheck
import {
  ColumnWorkflowByIDType,
  getColumnWorkflowByID
} from '@cfRedux/stateSelectors'
import * as React from 'react'
import { AppState } from '@cfRedux/type'
import { connect } from 'react-redux'
import {
  NodeBarColumn,
  NodeBarColumnCreator
} from '@cfCommonComponents/rightSideBarContent/NodeBar/components/NodeBarColumn'

/**
 * More or less a dummy container which renders
 * the column into itself.
 * We can also have this be a "column creator" which
 * instead CREATES a default column which is currently missing
 */
type SelfProps = {
  columnType?: number
  objectID?: number
  parentID?: number
  columnChoices: number[] // was from renderer
}
type ConnectedProps = ColumnWorkflowByIDType
type PropsType = SelfProps & ConnectedProps
class NodeBarColumnWorkflowUnconnected extends React.Component<PropsType> {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    if (this.props.data)
      return (
        // @todo was
        // <div className="node-bar-column-workflow" ref={this.maindiv}>
        // however this.maindiv is not defined in this class
        <div className="node-bar-column-workflow">
          <NodeBarColumn
            objectID={this.props.data.column}
            // renderer={this.props.renderer}
            throughParentID={this.props.data.id}
            parentID={this.props.parentID}
          />
        </div>
      )
    else
      return (
        // @todo was
        // <div className="node-bar-column-workflow" ref={this.maindiv}>
        // however this.maindiv is not defined in this class
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
): ColumnWorkflowByIDType => {
  return getColumnWorkflowByID(state, ownProps.objectID)
}

const NodeBarColumnWorkflow = connect(
  mapStateToProps,
  null
)(NodeBarColumnWorkflowUnconnected)

export default NodeBarColumnWorkflow
