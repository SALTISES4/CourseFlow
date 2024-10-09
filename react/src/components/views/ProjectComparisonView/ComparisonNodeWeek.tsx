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
        //   readOnly: this.props.renderer.readOnly,
        //   contextChoices: this.props.renderer.contextChoices,
        //   outcome_type_choices: this.props.renderer.outcome_type_choices,
        //   strategyClassification_choices:
        //     this.props.renderer.strategyClassification_choices,
        //   changeField: this.props.renderer.changeField,
        //   workflowId: this.props.renderer.workflowId,
        //   unreadComments: this.props.renderer.unreadComments,
        //   add_comments: this.props.renderer.add_comments,
        //   viewComments: this.props.renderer.viewComments,
        //   selectionManager: this.props.renderer.selectionManager
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
