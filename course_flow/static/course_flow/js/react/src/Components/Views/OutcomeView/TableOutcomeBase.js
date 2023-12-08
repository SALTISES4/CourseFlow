import * as React from 'react'
import { connect } from 'react-redux'
import { Component } from '../../components/CommonComponents/Extended'
import { getOutcomeByID } from '../../../redux/FindState.js'
import TableOutcomeView, {
  TableOutcomeViewUnconnected
} from './TableOutcomeView.js'

class MatrixOutcomeViewUnconnected extends TableOutcomeViewUnconnected {
  toggleDrop() {
    this.setState({ is_dropped: !this.state.is_dropped })
  }

  getIsDropped() {
    return this.state.is_dropped
  }

  getChildOutcomeView(child) {
    return (
      <MatrixOutcomeView
        outcomes_type={this.props.outcomes_type}
        objectID={child.id}
        outcome_tree={child}
        renderer={this.props.renderer}
      />
    )
  }
}

const mapOutcomeStateToProps = (state, own_props) =>
  getOutcomeByID(state, own_props.objectID)

/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const MatrixOutcomeView = connect(
  mapOutcomeStateToProps,
  null
)(MatrixOutcomeViewUnconnected)

/**
 *
 */
class TableOutcomeBaseUnconnected extends Component {
  getOutcomeView(outcome_tree) {
    if (this.props.type === 'outcome_table') {
      return (
        <TableOutcomeView
          outcomes_type={this.props.outcomes_type}
          objectID={this.outcome_tree.id}
          outcome_tree={this.outcome_tree}
          renderer={this.props.renderer}
        />
      )
    }
    return (
      <MatrixOutcomeView
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
    let outcome_tree = OutcomeNode.createOutcomeNodeBranch(
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
const TableOutcomeBase = connect((state, own_props) => {
  return {
    outcomes_type: state.workflow.outcomes_type,
    outcome: state.outcome,
    outcomenode: state.outcomenode,
    outcomeoutcome: state.outcomeoutcome
  }
}, null)(TableOutcomeBaseUnconnected)

export default TableOutcomeBase
