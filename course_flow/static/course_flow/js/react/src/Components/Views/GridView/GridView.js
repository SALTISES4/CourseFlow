import * as React from 'react'
import { connect } from 'react-redux'
// @components
import { getWeekWorkflowByID, getWeekByID } from '@cfFindState'
import GridWeek from './GridWeek.js'

/**
 * Creates a grid with just nodes by week and their times
 */
class GridView extends React.Component {
  constructor(props) {
    super(props)
    this.objectType = 'workflow'
    this.state = { dropped_list: [] }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.workflow

    let weeks = this.props.weeks.map((week, i) => (
      <GridWeek renderer={this.props.renderer} data={week.data} rank={i} />
    ))

    return (
      <div className="workflow-details">
        <div className="grid-ponderation">
          {gettext('Times in hours shown in format') +
            ': ' +
            gettext('Theory') +
            '/' +
            gettext('Practical') +
            '/' +
            gettext('Individual')}
        </div>
        <div className="workflow-grid">{weeks}</div>
      </div>
    )
  }
}
const mapStateToProps = (state, own_props) => {
  let weeks = state.workflow.weekworkflow_set
    .map((weekworkflow) => getWeekWorkflowByID(state, weekworkflow).data.week)
    .map((week) => getWeekByID(state, week))
  return { workflow: state.workflow, weeks: weeks }
}
export default connect(mapStateToProps, null)(GridView)
