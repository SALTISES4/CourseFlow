import * as React from 'react'
import { connect } from 'react-redux'
import Outcome from './Outcome.js'
import { getOutcomeWorkflowByID } from '@cfFindState'

/**
 * OutcomeWorkflow for the tables.
 * Not currently used.
 */
class TableOutcomeWorkflowUnconnected extends React.Component {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data
    return (
      <div>
        <Outcome
          renderer={this.props.renderer}
          objectID={data.outcome}
          nodecategory={this.props.nodecategory}
          outcomes_type={this.props.outcomes_type}
        />
      </div>
    )
  }
}
const mapOutcomeWorkflowStateToProps = (state, own_props) =>
  getOutcomeWorkflowByID(state, own_props.objectID)
const TableOutcomeWorkflow = connect(
  mapOutcomeWorkflowStateToProps,
  null
)(TableOutcomeWorkflowUnconnected)

export default TableOutcomeWorkflow
