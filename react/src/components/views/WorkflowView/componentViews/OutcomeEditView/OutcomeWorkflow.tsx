import * as React from 'react'
import { connect } from 'react-redux'
import { getOutcomeWorkflowByID, TGetOutcomeWorkflowByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import { CfObjectType } from '@cf/types/enum'
import Outcome from '@cfViews/WorkflowView/componentViews/OutcomeEditView/Outcome'

type ConnectedProps = TGetOutcomeWorkflowByID
type OwnProps = {
  objectId: any
  show_horizontal: any
  renderer: any
  parentID: any
}

type PropsType = ConnectedProps & OwnProps

/**
 * OutcomeWorkflow used in the outcome edit view.
 * Not currently  used.
 */
class OutcomeWorkflowUnconnected extends React.Component<PropsType> {
  private objectType: string
  private objectClass: string
  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.OUTCOMEWORKFLOW
    this.objectClass = '.outcome-workflow'
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    let my_class = 'outcome-workflow'
    if (data.no_drag) my_class += ' no-drag'
    return (
      <div className={my_class} id={data.id}>
        <Outcome
          objectId={data.outcome}
          parentID={this.props.parentID}
          throughParentID={data.id}
          // renderer={this.props.renderer}
          show_horizontal={this.props.show_horizontal}
        />
      </div>
    )
  }
}
const mapOutcomeWorkflowStateToProps = (
  state: AppState,
  ownProps: OwnProps
) => {
  return getOutcomeWorkflowByID(state, ownProps.objectId)
}
const OutcomeWorkflow = connect<ConnectedProps, object, OwnProps, AppState>(
  mapOutcomeWorkflowStateToProps,
  null
)(OutcomeWorkflowUnconnected)

export default OutcomeWorkflow
