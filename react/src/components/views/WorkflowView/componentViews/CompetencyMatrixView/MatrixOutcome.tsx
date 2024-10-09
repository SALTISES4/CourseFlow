import { TGetOutcomeByID, getOutcomeByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import { OutcomeUnconnected as TableOutcomeUnconnected } from '@cfViews/WorkflowView/componentViews/OutcomeTableView/components/Outcome'
import * as React from 'react'
import { connect } from 'react-redux'

type ConnectedProps = TGetOutcomeByID
type OwnProps = {
  objectId: number
  outcomesType: any
  outcome_tree?: any
}
type StateProps = {
  isDropped: boolean
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
      isDropped: !this.state.isDropped
    })
  }

  getIsDropped() {
    return this.state.isDropped
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  ChildOutcomeView = ({ child }) => {
    return (
      <MatrixOutcome
        outcomesType={this.props.outcomesType}
        objectId={child.id}
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
  return getOutcomeByID(state, ownProps.objectId)
}
/*******************************************************
 * CONNECT REDUX
 *******************************************************/
const MatrixOutcome = connect<ConnectedProps, object, OwnProps, AppState>(
  mapOutcomeStateToProps,
  null
)(MatrixOutcomeUnconnected)

export default MatrixOutcome
