import * as React from 'react'
import { connect } from 'react-redux'
import Outcome from './Outcome'
import { getOutcomeWorkflowByID, TGetOutcomeWorkflowByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'

type ConnectedProps = TGetOutcomeWorkflowByID
type OwnProps = {
  objectId: number
  nodecategory: any
  outcomes_type: any
}
type PropsType = ConnectedProps & OwnProps
/**
 * OutcomeWorkflow for the tables.
 * Not currently used.
 */
class TableOutcomeWorkflowUnconnected extends React.Component<PropsType> {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    return (
      <div>
        <Outcome
          // renderer={this.props.renderer}
          objectId={data.outcome}
          nodecategory={this.props.nodecategory}
          outcomes_type={this.props.outcomes_type}
        />
      </div>
    )
  }
}
const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): TGetOutcomeWorkflowByID => {
  return getOutcomeWorkflowByID(state, ownProps.objectId)
}
const TableOutcomeWorkflow = connect<
  ConnectedProps,
  object,
  OwnProps,
  AppState
>(
  mapStateToProps,
  null
)(TableOutcomeWorkflowUnconnected)

export default TableOutcomeWorkflow
