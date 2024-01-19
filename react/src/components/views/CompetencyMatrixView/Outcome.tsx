import * as React from 'react'
import { connect } from 'react-redux'
import { getOutcomeByID, GetOutcomeByIDType } from '@cfFindState'
import { OutcomeUnconnected as TableOutcomeUnconnected } from '@cfViews/OutcomeTableView/Outcome'
import { AppState } from '@cfRedux/type'

type ConnectedProps = GetOutcomeByIDType
type OwnProps = {
  objectID: number
  outcomes_type: any
}
type StateProps = {
  is_dropped: boolean
}
type PropsType = ConnectedProps & OwnProps
/**
 * The block for an outcome in the competency matrix
 */
class OutcomeUnconnected extends TableOutcomeUnconnected<
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

const mapOutcomeStateToProps = (
  state: AppState,
  ownProps: OwnProps
): GetOutcomeByIDType => {
  return getOutcomeByID(state, ownProps.objectID)
}
/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const Outcome = connect<ConnectedProps, object, OwnProps, AppState>(
  mapOutcomeStateToProps,
  null
)(OutcomeUnconnected)

export default Outcome
