import * as React from 'react'
import { connect } from 'react-redux'
import { getOutcomeByID, TGetOutcomeByID } from '@cfFindState'
import { OutcomeUnconnected as TableOutcomeUnconnected } from '@cfViews/WorkflowView/componentViews/OutcomeTableView/components/Outcome'
import { AppState } from '@cfRedux/types/type'

type ConnectedProps = TGetOutcomeByID
type OwnProps = {
  objectID: number
  outcomes_type: any
  outcome_tree?: any
}
type StateProps = {
  is_dropped: boolean
}
type PropsType = ConnectedProps & OwnProps
/**
 * The block for an outcome in the competency matrix
 */
class MatrixOutcomeUnconnected extends TableOutcomeUnconnected<
  PropsType,
  StateProps
> {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  toggleDrop = () => {
    this.setState({
      is_dropped: !this.state.is_dropped
    })
  }

  getIsDropped() {
    return this.state.is_dropped
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  ChildOutcomeView = ({ child }) => {
    return (
      <MatrixOutcome
        outcomes_type={this.props.outcomes_type}
        objectID={child.id}
        // @this is weird
        outcome_tree={child}
        // renderer={this.props.renderer}
      />
    )
  }
}

const mapOutcomeStateToProps = (
  state: AppState,
  ownProps: OwnProps
): TGetOutcomeByID => {
  return getOutcomeByID(state, ownProps.objectID)
}
/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const MatrixOutcome = connect<ConnectedProps, object, OwnProps, AppState>(
  mapOutcomeStateToProps,
  null
)(MatrixOutcomeUnconnected)

export default MatrixOutcome
