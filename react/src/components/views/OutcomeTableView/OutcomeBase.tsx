import * as React from 'react'
import { connect } from 'react-redux'
import { default as MatrixOutcome } from '@cfViews/CompetencyMatrixView/CompetencyMatrixView'
import { AppState } from '@cfRedux/type'
import ComponentWithToggleDrop from '@cfParentComponents/ComponentWithToggleDrop'
import { createOutcomeNodeBranch } from '@cfModule/utility/createOutcomeNodeBranch'
import { default as TableOutcome } from '@cfViews/OutcomeTableView/Outcome'
import { AnyAction, Dispatch } from '@reduxjs/toolkit'
/**
 * The base representation of an outcome line in a table,
 * regardless of the orientation of the table
 */
type ConnectedProps = {
  outcomes_type: any
  outcome: any
  outcomenode: any
  outcomeoutcome: any
}
// type ConnectedProps = ReturnType<typeof mapStateToProps>

type OwnProps = {
  type: string
  nodecategory: any
  objectID: number
  // renderer: any
  outcome_type: any
}
type PropsType = OwnProps & ConnectedProps

class OutcomeBaseUnconnected extends ComponentWithToggleDrop<PropsType> {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  OutcomeView = ({ outcomeTree }) => {
    if (this.props.type === 'outcome_table') {
      return (
        <TableOutcome
          outcomes_type={this.props.outcomes_type}
          // objectID={this.outcome_tree.id} @todo these were the original vars, but they don't exist
          // outcome_tree={this.outcome_tree}
          objectID={outcomeTree.id}
          outcome_tree={outcomeTree}
          // renderer={this.props.renderer}
        />
      )
    }
    return (
      <MatrixOutcome
        outcomes_type={this.props.outcomes_type}
        //objectID={this.outcome_tree.id} @todo these were the original vars, but they don't exist
        // outcome_tree={this.outcome_tree}
        objectID={outcomeTree.id}
        // outcome_tree={outcomeTree} // defined as prop but not used in component
        // renderer={this.props.renderer}
      />
    )
  }
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const outcomeTree = createOutcomeNodeBranch(
      this.props,
      this.props.objectID,
      this.props.nodecategory
    )

    // @todo seem to be re-rendering issue, wait for hooks
    //avoid further rerenders if possible
    // const outcome_tree_json = JSON.stringify(outcome_tree)
    //
    // if (this.outcome_tree_json === outcome_tree_json) {
    //   outcome_tree = this.outcome_tree
    // } else {
    //   this.outcome_tree = outcome_tree
    //   this.outcome_tree_json = outcome_tree_json
    // }

    return <this.OutcomeView outcomeTree={outcomeTree} />
  }
}

/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const mapStateToProps = (state: AppState): ConnectedProps => {
  return {
    outcomes_type: state.workflow.outcomes_type,
    outcome: state.outcome,
    outcomenode: state.outcomenode,
    outcomeoutcome: state.outcomeoutcome
  }
}
const mapDispatchToProps = (dispatch: Dispatch<AnyAction>) => ({})

const OutcomeBase = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(OutcomeBaseUnconnected)

export default OutcomeBase
