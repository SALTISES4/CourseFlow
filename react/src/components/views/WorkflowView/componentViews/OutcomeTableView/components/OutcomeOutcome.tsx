import { CfObjectType } from '@cf/types/enum.js'
import { TOutcomeOutcomeByID, getOutcomeOutcomeById } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import * as React from 'react'
import { connect } from 'react-redux'

import Outcome from './Outcome'

type ConnectedProps = TOutcomeOutcomeByID
type OwnProps = {
  objectId: number
  parentID: any
  nodecategory: any
  updateParentCompletion: any
  completion_status_from_parents: any
  outcomesType: any
}
type PropsType = ConnectedProps & OwnProps

/**
 * Outcome to child outcome link in the table view.
 * Not currently used
 */
class TableOutcomeOutcomeUnconnected extends React.Component<PropsType> {
  private objectType: CfObjectType
  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.OUTCOMEOUTCOME
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data

    //Child outcomes. See comment in models/outcome.py for more info.
    return (
      // <div className="outcome-outcome" id={data.id} ref={this.mainDiv}> this.mainDiv is not defined
      <div className="outcome-outcome" id={String(data.id)}>
        <Outcome
          // renderer={this.props.renderer}
          objectId={data.child}
          parentID={this.props.parentID}
          throughParentID={data.id}
          nodecategory={this.props.nodecategory}
          updateParentCompletion={this.props.updateParentCompletion}
          completion_status_from_parents={
            this.props.completion_status_from_parents
          }
          outcomesType={this.props.outcomesType}
        />
      </div>
    )
  }
}
const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): TOutcomeOutcomeByID => {
  return getOutcomeOutcomeById(state, ownProps.objectId)
}

const TableOutcomeOutcome = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(TableOutcomeOutcomeUnconnected)

export default TableOutcomeOutcome
