import * as React from 'react'
import { TGetWeekWorkflowByID, getWeekWorkflowByID } from '@cfFindState'
import { connect } from 'react-redux'
import { AppState } from '@cfRedux/types/type'
import JumpToWeekView from '@cfViews/WorkflowView/WorkflowViewLayout/components/menuBar/JumpToWeekView'

type ConnectedProps = TGetWeekWorkflowByID
type OwnProps = {
  objectID: number
  parentID?: number
  order?: any // @this is conflict with the redux props map, is it an intentional ovveride?
}
type PropsType = ConnectedProps & OwnProps

/**
 * The weekworkflow representation for the "jump to" menu
 */
class JumpToWeekWorkflowUnconnected extends React.Component<PropsType> {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    return (
      <JumpToWeekView
        objectID={data.week}
        rank={this.props.order.indexOf(data.id)}
        parentID={this.props.parentID}
        throughParentID={data.id}
      />
    )
  }
}
const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): TGetWeekWorkflowByID => {
  return getWeekWorkflowByID(state, ownProps.objectID)
}

const JumpToWeekWorkflow = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(JumpToWeekWorkflowUnconnected)

export default JumpToWeekWorkflow
