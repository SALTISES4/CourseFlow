import * as React from 'react'
import { connect } from 'react-redux'
import Outcome from './Outcome'
import {
  getOutcomeWorkflowByID,
  GetOutcomeWorkflowByIDType
} from '@cfFindState'
import { AppState } from '@cfRedux/type'

type ConnectedProps = GetOutcomeWorkflowByIDType
type OwnProps = {
  objectID: number
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
          objectID={data.outcome}
          nodecategory={this.props.nodecategory}
          outcomes_type={this.props.outcomes_type}
        />
      </div>
    )
  }
}
const mapOutcomeWorkflowStateToProps = (
  state: AppState,
  ownProps: OwnProps
): GetOutcomeWorkflowByIDType => {
  return getOutcomeWorkflowByID(state, ownProps.objectID)
}
const TableOutcomeWorkflow = connect<
  ConnectedProps,
  object,
  OwnProps,
  AppState
>(
  mapOutcomeWorkflowStateToProps,
  null
)(TableOutcomeWorkflowUnconnected)

export default TableOutcomeWorkflow
