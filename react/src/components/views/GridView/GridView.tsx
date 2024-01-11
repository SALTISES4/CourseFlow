import * as React from 'react'
import { connect } from 'react-redux'
// @components
import { getWeekWorkflowByID, getWeekByID } from '@cfFindState'
import GridWeek from './GridWeek'
import { AppState, Workflow } from '@cfRedux/type'

/**
 * Creates a grid with just nodes by week and their times
 */

type OwnProps = {
  renderer: any
}
type ConnectedProps = {
  workflow: Workflow
  weeks: any[]
}

type StateType = {
  dropped_list: any[]
}
type PropsType = OwnProps & ConnectedProps
class GridView extends React.Component<PropsType, StateType> {
  constructor(props: PropsType) {
    super(props)
    // this.objectType = 'workflow' @todo objectType is not used
    this.state = { dropped_list: [] }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    // const data = this.props.workflow

    const weeks = this.props.weeks.map((week, i) => (
      <GridWeek
        key={i}
        renderer={this.props.renderer}
        data={week.data}
        rank={i}
      />
    ))

    return (
      <div className="workflow-details">
        <div className="grid-ponderation">
          {window.gettext('Times in hours shown in format') +
            ': ' +
            window.gettext('Theory') +
            '/' +
            window.gettext('Practical') +
            '/' +
            window.gettext('Individual')}
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
  const weeks = state.workflow.weekworkflow_set
    .map((weekworkflow) => getWeekWorkflowByID(state, weekworkflow).data.week)
    .map((week) => getWeekByID(state, week))

  return {
    workflow: state.workflow,
    weeks: weeks
  }
}
export default connect<
  ConnectedProps,
  NonNullable<unknown>,
  OwnProps,
  AppState
>(
  mapStateToProps,
  null
)(GridView)
