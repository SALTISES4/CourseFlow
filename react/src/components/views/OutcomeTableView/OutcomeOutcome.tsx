// @ts-nocheck
import * as React from 'react'
import { connect } from 'react-redux'
import Outcome from './Outcome'
import { getOutcomeOutcomeByID } from '@cfFindState'
import { CfObjectType } from '@cfModule/types/enum.js'
import { AppState } from '@cfRedux/type'

/**
 * Outcome to child outcome link in the table view.
 * Not currently used
 */
class TableOutcomeOutcomeUnconnected extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = CfObjectType.OUTCOMEOUTCOME
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data

    return (
      <div className="outcome-outcome" id={data.id} ref={this.mainDiv}>
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
const mapStateToProps = (state: AppState, ownProps) => {
  return getOutcomeOutcomeByID(state, ownProps.objectID)
}

const TableOutcomeOutcome = connect(
  mapStateToProps,
  null
)(TableOutcomeOutcomeUnconnected)

export default TableOutcomeOutcome
