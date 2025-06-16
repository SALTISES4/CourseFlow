import { CfObjectType } from '@cf/types/enum'
import { TGetOutcomeWorkflowByID, getOutcomeWorkflowByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import * as React from 'react'
import { connect } from 'react-redux'

import Outcome from './Outcome'

type ConnectedProps = TGetOutcomeWorkflowByID
type OwnProps = {
  objectId: any
  showHorizontal: any
  renderer: any
  parentId: any
}

type PropsType = ConnectedProps & OwnProps

/**
 * OutcomeWorkflow used in the outcome edit view.
 * Not currently  used.
 */
class OutcomeWorkflowUnconnected extends React.Component<PropsType> {
  private objectType: string
  private objectClass: string
  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.OUTCOMEWORKFLOW
    this.objectClass = '.outcome-workflow'
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    let myClass = 'outcome-workflow'
    if (data.noDrag) {
      myClass += ' no-drag'
    }
    return (
      <div className={myClass} id={data.id}>
        <Outcome
          objectId={data.outcome}
          parentId={this.props.parentId}
          throughParentId={data.id}
          // renderer={this.props.renderer}
          showHorizontal={this.props.showHorizontal}
        />
      </div>
    )
  }
}
const mapOutcomeWorkflowStateToProps = (
  state: AppState,
  ownProps: OwnProps
) => {
  return getOutcomeWorkflowByID(state, ownProps.objectId)
}
const OutcomeWorkflow = connect<ConnectedProps, object, OwnProps, AppState>(
  mapOutcomeWorkflowStateToProps,
  null
)(OutcomeWorkflowUnconnected)

export default OutcomeWorkflow
