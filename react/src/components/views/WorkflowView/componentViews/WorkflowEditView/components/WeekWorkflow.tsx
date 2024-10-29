import { CfObjectType } from '@cf/types/enum'
import { TGetWeekWorkflowById, getWeekWorkflowByID } from '@cfFindState'
import { AppState } from '@cfRedux/types/type'
import React from 'react'
import { connect } from 'react-redux'

import Term from './Term'
import Week from './Week'

type ConnectedProps = TGetWeekWorkflowById
type OwnProps = {
  condensed: boolean
  objectId: number
  parentID: number
}

export type WeekWorkflowUnconnectedProps = OwnProps
type PropsType = OwnProps & ConnectedProps

/**
 * The week-workflow throughmodel representation
 */
class WeekWorkflowUnconnected<P extends PropsType> extends React.Component<P> {
  mainDiv: React.RefObject<HTMLDivElement>
  objectType: CfObjectType
  protected objectClass: string

  constructor(props: P) {
    super(props)
    this.objectType = CfObjectType.WEEKWORKFLOW
    this.objectClass = '.week-workflow'
    this.mainDiv = React.createRef()
  }
  /*******************************************************
   * COMPONENTS
   *******************************************************/
  WeekWrapper = () => {
    const data = this.props.data
    if (this.props.condensed) {
      return (
        <Term
          objectId={data.week}
          rank={this.props.order.indexOf(data.id)}
          parentID={this.props.parentID}
          // renderer={this.props.renderer}
          throughParentID={data.id}
        />
      )
    }

    return (
      <Week
        objectId={data.week}
        rank={this.props.order.indexOf(data.id)}
        parentID={this.props.parentID}
        throughParentID={data.id}
      />
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data

    const cssClasses = [
      'week-workflow',
      data.noDrag ? 'no-drag' : '',
      $(this.mainDiv?.current).hasClass('dragging') ? 'dragging' : ''
    ].join(' ')

    // let my_class = 'week-workflow'
    // if (data.noDrag) my_class += ' no-drag'
    // if ($(this.mainDiv?.current).hasClass('dragging')) my_class += ' dragging'

    return (
      <div
        className={cssClasses}
        id={String(data.id)}
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
): TGetWeekWorkflowById => {
  return getWeekWorkflowByID(state, ownProps.objectId)
}

const WeekWorkflow = connect<ConnectedProps, object, OwnProps, AppState>(
  mapWeekWorkflowStateToProps,
  null
)(WeekWorkflowUnconnected)

export default WeekWorkflow
export { WeekWorkflowUnconnected }
