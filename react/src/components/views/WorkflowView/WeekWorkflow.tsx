import * as React from 'react'
import { connect } from 'react-redux'
import Week from './Week'
import Term from './Term'
import { GetWeekWorkflowByID, getWeekWorkflowByID } from '@cfFindState'
import { AppState } from '@cfRedux/type'
import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfParentComponents/ComponentWithToggleDrop'
import { CfObjectType } from '@cfModule/types/enum'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'
// import $ from 'jquery'

type ConnectedProps = GetWeekWorkflowByID
type OwnProps = {
  condensed: boolean
  objectID: number
  parentID: number
  // renderer: any
} & ComponentWithToggleProps
type PropsType = ConnectedProps & OwnProps

/**
 * The week-workflow throughmodel representation
 */
class WeekWorkflowUnconnected extends ComponentWithToggleDrop<PropsType> {

  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.WEEKWORKFLOW
    this.objectClass = '.week-workflow'
  }
  /*******************************************************
   * COMPONENTS
   *******************************************************/
  Week = () => {
    const data = this.props.data
    if (this.props.condensed) {
      return (
        <Term
          objectID={data.week}
          rank={this.props.order.indexOf(data.id)}
          parentID={this.props.parentID}
          // renderer={this.props.renderer}
          throughParentID={data.id}
        />
      )
    }

    return (
      <Week
        objectID={data.week}
        rank={this.props.order.indexOf(data.id)}
        parentID={this.props.parentID}
        // renderer={this.props.renderer}
        throughParentID={data.id}
      />
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data.id

    const cssClasses = [
      'week-workflow',
      data.no_drag ? 'no-drag' : '',
      $(this.mainDiv?.current).hasClass('dragging') ? 'dragging' : ''
    ].join(' ')
    // let my_class = 'week-workflow'
    // if (data.no_drag) my_class += ' no-drag'
    // if ($(this.mainDiv?.current).hasClass('dragging')) my_class += ' dragging'

    return (
      <div
        className={cssClasses}
        id={data.id}
        ref={this.mainDiv}
        data-child-id={data.week}
      >
        <this.Week />
      </div>
    )
  }
}
const mapWeekWorkflowStateToProps = (
  state: AppState,
  ownProps: OwnProps
): GetWeekWorkflowByID => {
  return getWeekWorkflowByID(state, ownProps.objectID)
}

const WeekWorkflow = connect<ConnectedProps, object, OwnProps, AppState>(
  mapWeekWorkflowStateToProps,
  null
)(WeekWorkflowUnconnected)

export default WeekWorkflow
export { WeekWorkflowUnconnected }
