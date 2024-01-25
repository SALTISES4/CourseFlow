import * as React from 'react'
import { connect } from 'react-redux'
import Term from './Term'
import { TGetWeekWorkflowByID, getWeekWorkflowByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import ComponentWithToggleDrop, {
  ComponentWithToggleProps
} from '@cfParentComponents/ComponentWithToggleDrop'
import { CfObjectType } from '@cfModule/types/enum'
import Week from './Week'

type ConnectedProps = TGetWeekWorkflowByID
type OwnProps = {
  condensed: boolean
  objectID: number
  parentID: number
  // renderer: any
} & ComponentWithToggleProps

export type WeekWorkflowUnconnectedProps = OwnProps
type PropsType = OwnProps & ConnectedProps

/**
 * The week-workflow throughmodel representation
 */
class WeekWorkflowUnconnected<
  P extends PropsType
> extends ComponentWithToggleDrop<P> {
  constructor(props: P) {
    super(props)
    this.objectType = CfObjectType.WEEKWORKFLOW
    this.objectClass = '.week-workflow'
  }
  /*******************************************************
   * COMPONENTS
   *******************************************************/
  WeekWrapper = () => {
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
        <this.WeekWrapper />
      </div>
    )
  }
}
const mapWeekWorkflowStateToProps = (
  state: AppState,
  ownProps: OwnProps
): TGetWeekWorkflowByID => {
  return getWeekWorkflowByID(state, ownProps.objectID)
}

const WeekWorkflow = connect<ConnectedProps, object, OwnProps, AppState>(
  mapWeekWorkflowStateToProps,
  null
)(WeekWorkflowUnconnected)

export default WeekWorkflow
export { WeekWorkflowUnconnected }
