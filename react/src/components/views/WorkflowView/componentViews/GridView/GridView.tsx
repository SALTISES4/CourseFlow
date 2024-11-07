import { _t } from '@cf/utility/Utility.class'
import {
  TGetWeekByIDType,
  getWeekById,
  getWeekWorkflowByID
} from '@cfFindState'
import { AppState, TWorkflow } from '@cfRedux/types/type'
import * as React from 'react'
import { connect } from 'react-redux'

import GridWeek from './GridWeek'
// @components

/**
 * Creates a grid with just nodes by week and their times
 * seems to be only or program
 */

type OwnProps = NonNullable<unknown>

type ConnectedProps = {
  workflow: TWorkflow
  weeks: TGetWeekByIDType[]
}

type StateType = {
  droppedList: any[]
}
type PropsType = OwnProps & ConnectedProps
class GridViewUnconnected extends React.Component<PropsType, StateType> {
  constructor(props: PropsType) {
    super(props)
    this.state = { droppedList: [] }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    // const data = this.props.workflow

    const weeks = this.props.weeks.map((week, index) => (
      <GridWeek key={index} data={week.data} rank={index} />
    ))

    return (
      <div className="workflow-details">
        <div className="grid-ponderation">
          {_t('Times in hours shown in format') +
            ': ' +
            _t('Theory') +
            '/' +
            _t('Practical') +
            '/' +
            _t('Individual')}
        </div>
        <div className="workflow-grid">{weeks}</div>
      </div>
    )
  }
}
const mapStateToProps = (
  state: AppState,
  ownProps: OwnProps
): ConnectedProps => {
  const weeks = state.workflow.weekworkflowSet
    .map((weekworkflow) => getWeekWorkflowByID(state, weekworkflow).data.week)
    .map((week) => getWeekById(state, week))

  return {
    workflow: state.workflow,
    weeks: weeks
  }
}
const GridView = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(GridViewUnconnected)

export default GridView
