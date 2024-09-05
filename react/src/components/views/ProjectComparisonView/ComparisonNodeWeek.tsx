import { TGetNodeWeekByID, getNodeWeekByID } from '@cfFindState'
// @local
import { AppState } from '@cfRedux/types/type'
import ComparisonNode from '@cfViews/ProjectComparisonView/ComparisonNode'
import { NodeWeekUnconnected } from '@cfViews/WorkflowView/componentViews/WorkflowView/components/NodeWeek'
import * as React from 'react'
import { connect } from 'react-redux'

type ConnectedProps = TGetNodeWeekByID
type OwnProps = any
type PropsType = ConnectedProps & OwnProps

/**
 * NodeWeek for the comparison view
 */
class ComparisonNodeWeekUnconnected extends NodeWeekUnconnected<PropsType> {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  NodeWrapper = () => {
    const data = this.props.data
    return (
      <ComparisonNode
        objectId={data.node}
        parentID={this.props.parentID}
        // @ts-ignore
        column_order={this.props.column_order}
        // throughParentID={data.id}
        // legacyRenderer={this.props.renderer}
        // legacyRenderer={{
        //   task_choices: this.props.renderer.task_choices,
        //   time_choices: this.props.renderer.time_choices,
        //   read_only: this.props.renderer.read_only,
        //   context_choices: this.props.renderer.context_choices,
        //   outcome_type_choices: this.props.renderer.outcome_type_choices,
        //   strategy_classification_choices:
        //     this.props.renderer.strategy_classification_choices,
        //   change_field: this.props.renderer.change_field,
        //   workflowID: this.props.renderer.workflowID,
        //   unread_comments: this.props.renderer.unread_comments,
        //   add_comments: this.props.renderer.add_comments,
        //   view_comments: this.props.renderer.view_comments,
        //   selection_manager: this.props.renderer.selection_manager
        // }}
      />
    )
  }
}
const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): TGetNodeWeekByID => {
  return getNodeWeekByID(state, ownProps.objectId)
}
const ComparisonNodeWeek = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(ComparisonNodeWeekUnconnected)

export default ComparisonNodeWeek
