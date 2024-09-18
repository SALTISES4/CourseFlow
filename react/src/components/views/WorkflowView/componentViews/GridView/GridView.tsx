import { _t } from '@cf/utility/utilityFunctions'
import { getWeekByID, getWeekWorkflowByID } from '@cfFindState'
import { AppState, TWorkflow } from '@cfRedux/types/type'
import GridWeek from '@cfViews/WorkflowView/componentViews/GridView/GridWeek'
import * as React from 'react'
import { connect } from 'react-redux'
// @components

/**
 * Creates a grid with just nodes by week and their times
 */

type OwnProps = NonNullable<unknown>

type ConnectedProps = {
  workflow: TWorkflow
  weeks: any[]
}

type StateType = {
  dropped_list: any[]
}
type PropsType = OwnProps & ConnectedProps
class GridViewUnconnected extends React.Component<PropsType, StateType> {
  constructor(props: PropsType) {
    super(props)
    this.state = { dropped_list: [] }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    // const data = this.props.workflow

    const weeks = this.props.weeks.map((week, index) => (
      <GridWeek
        key={index}
        // renderer={this.props.renderer}
        data={week.data}
        rank={index}
      />
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
    .map((week) => getWeekByID(state, week))

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
