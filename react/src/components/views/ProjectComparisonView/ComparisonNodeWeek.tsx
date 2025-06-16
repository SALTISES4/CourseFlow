// @local
import { getNodeWeekById } from '@cfRedux/selectors/nodeweek.selector'
import { AppState } from '@cfRedux/types/type'
import ComparisonNode from '@cfViews/ProjectComparisonView/ComparisonNode'
import { NodeWeekUnconnected } from '@cfViews/WorkflowView/componentViews/WorkflowView/components/NodeWeek'
import { connect } from 'react-redux'

type ConnectedProps = TGetNodeWeekById
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
        parentId={this.props.parentId}
        // @ts-ignore
        columnOrder={this.props.columnOrder}
        // throughParentId={data.id}
        // legacyRenderer={this.props.renderer}
        // legacyRenderer={{
        //   taskChoices: this.props.renderer.taskChoices,
        //   timeChoices: this.props.renderer.timeChoices,
        //   readOnly: this.props.renderer.readOnly,
        //   contextChoices: this.props.renderer.contextChoices,
        //   outcome_type_choices: this.props.renderer.outcome_type_choices,
        //   strategyClassification_choices:
        //     this.props.renderer.strategyClassification_choices,
        //   changeField: this.props.renderer.changeField,
        //   workflowId: this.props.renderer.workflowId,
        //   unreadComments: this.props.renderer.unreadComments,
        //   addComments: this.props.renderer.addComments,
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
): TGetNodeWeekById => {
  return getNodeWeekById(state, ownProps.objectId)
}
const ComparisonNodeWeek = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(ComparisonNodeWeekUnconnected)

export default ComparisonNodeWeek
