import * as React from 'react'
import { connect } from 'react-redux'
import { getOutcomeWorkflowByID } from '@cfFindState'

/**
 * OutcomeWorkflow used in the outcome edit view.
 * Not currently  used.
 */
class OutcomeWorkflowUnconnected extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = 'outcomeworkflow'
    this.objectClass = '.outcome-workflow'
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data
    let my_class = 'outcome-workflow'
    if (data.no_drag) my_class += ' no-drag'
    return (
      <div className={my_class} id={data.id}>
        <OutcomeView
          objectID={data.outcome}
          parentID={this.props.parentID}
          throughParentID={data.id}
          renderer={this.props.renderer}
          show_horizontal={this.props.show_horizontal}
        />
      </div>
    )
  }
}
const mapOutcomeWorkflowStateToProps = (state, own_props) =>
  getOutcomeWorkflowByID(state, own_props.objectID)
const OutcomeWorkflow = connect(
  mapOutcomeWorkflowStateToProps,
  null
)(OutcomeWorkflowUnconnected)

export default OutcomeWorkflow
