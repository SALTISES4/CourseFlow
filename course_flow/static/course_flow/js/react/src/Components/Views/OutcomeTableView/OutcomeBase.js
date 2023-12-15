import * as React from 'react'
import { connect } from 'react-redux'
import { Component } from '@cfCommonComponents'
import { getOutcomeByID } from '@cfFindState'
import TableOutcome from './Outcome.js'
import { Outcome as MatrixOutcome } from '../CompetencyMatrixView'
import * as Utility from '@cfUtility'
/**
 * The base representation of an outcome line in a table,
 * regardless of the orientation of the table
 */
class OutcomeBaseUnconnected extends Component {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getOutcomeView(outcome_tree) {
    if (this.props.type === 'outcome_table') {
      return (
        <TableOutcome
          outcomes_type={this.props.outcomes_type}
          objectID={this.outcome_tree.id}
          outcome_tree={this.outcome_tree}
          renderer={this.props.renderer}
        />
      )
    }
    return (
      <MatrixOutcome
        outcomes_type={this.props.outcomes_type}
        objectID={this.outcome_tree.id}
        outcome_tree={this.outcome_tree}
        renderer={this.props.renderer}
      />
    )
  }
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let outcome_tree = Utility.createOutcomeNodeBranch(
      this.props,
      this.props.objectID,
      this.props.nodecategory
    )
    //avoid further rerenders if possible
    let outcome_tree_json = JSON.stringify(outcome_tree)

    if (this.outcome_tree_json === outcome_tree_json) {
      outcome_tree = this.outcome_tree
    } else {
      this.outcome_tree = outcome_tree
      this.outcome_tree_json = outcome_tree_json
    }

    return this.getOutcomeView(outcome_tree)
  }
}

/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const OutcomeBase = connect((state, own_props) => {
  return {
    outcomes_type: state.workflow.outcomes_type,
    outcome: state.outcome,
    outcomenode: state.outcomenode,
    outcomeoutcome: state.outcomeoutcome
  }
}, null)(OutcomeBaseUnconnected)

export default OutcomeBase
