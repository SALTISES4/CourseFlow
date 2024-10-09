import { TGetOutcomeWorkflowByID, getOutcomeWorkflowByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import * as React from 'react'
import { connect } from 'react-redux'

import Outcome from './Outcome'

type ConnectedProps = TGetOutcomeWorkflowByID
type OwnProps = {
  objectId: number
  nodecategory: any
  outcomesType: any
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
          outcomesType={this.props.outcomesType}
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
