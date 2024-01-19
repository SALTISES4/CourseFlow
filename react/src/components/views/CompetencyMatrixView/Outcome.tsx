import * as React from 'react'
import { connect } from 'react-redux'
import { getOutcomeByID } from '@cfFindState'
import { OutcomeUnconnected as TableOutcomeUnconnected } from '@cfViews/OutcomeTableView/Outcome'

/**
 * The block for an outcome in the competency matrix
 */
class OutcomeUnconnected extends TableOutcomeUnconnected {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  toggleDrop() {
    this.setState({ is_dropped: !this.state.is_dropped })
  }

  getIsDropped() {
    return this.state.is_dropped
  }

  getChildOutcomeView(child) {
    return (
      <Outcome
        outcomes_type={this.props.outcomes_type}
        objectID={child.id}
        outcome_tree={child}
        // renderer={this.props.renderer}
      />
    )
  }
}

const mapOutcomeStateToProps = (state, own_props) => {
  return getOutcomeByID(state, own_props.objectID)
}
/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const Outcome = connect(mapOutcomeStateToProps, null)(OutcomeUnconnected)

export default Outcome
