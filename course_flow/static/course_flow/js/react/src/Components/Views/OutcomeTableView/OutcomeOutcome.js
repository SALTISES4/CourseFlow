import * as React from 'react'
import * as reactDom from 'react-dom'
import { Provider, connect } from 'react-redux'
import Outcome from './Outcome.js'
import { getOutcomeOutcomeByID } from '@cfFindState'

/**
 * Outcome to child outcome link in the table view.
 * Not currently used
 */
class TableOutcomeOutcomeUnconnected extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = 'outcomeoutcome'
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.data

    return (
      <div className="outcome-outcome" id={data.id} ref={this.maindiv}>
        <Outcome
          renderer={this.props.renderer}
          objectID={data.child}
          parentID={this.props.parentID}
          throughParentID={data.id}
          nodecategory={this.props.nodecategory}
          updateParentCompletion={this.props.updateParentCompletion}
          completion_status_from_parents={
            this.props.completion_status_from_parents
          }
          outcomes_type={this.props.outcomes_type}
        />
      </div>
    )
  }
}
const mapOutcomeOutcomeStateToProps = (state, own_props) =>
  getOutcomeOutcomeByID(state, own_props.objectID)
const TableOutcomeOutcome = connect(
  mapOutcomeOutcomeStateToProps,
  null
)(TableOutcomeOutcomeUnconnected)

export default TableOutcomeOutcome
