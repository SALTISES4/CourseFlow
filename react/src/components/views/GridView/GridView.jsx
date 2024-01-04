import * as React from 'react'
import { connect } from 'react-redux'
// @components
import { getWeekWorkflowByID, getWeekByID } from '@cfFindState'
import GridWeek from './GridWeek'

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
    const data = this.props.workflow

    const weeks = this.props.weeks.map((week, i) => (
      <GridWeek renderer={this.props.renderer} data={week.data} rank={i} />
    ))

    return (
      <div className="workflow-details">
        <div className="grid-ponderation">
          {window.gettext('Times in hours shown in format') +
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
  const weeks = state.workflow.weekworkflow_set
    .map((weekworkflow) => getWeekWorkflowByID(state, weekworkflow).data.week)
    .map((week) => getWeekByID(state, week))
  return { workflow: state.workflow, weeks: weeks }
}
export default connect(mapStateToProps, null)(GridView)
