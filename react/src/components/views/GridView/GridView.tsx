import * as React from 'react'
import { connect } from 'react-redux'
// @components
import { getWeekWorkflowByID, getWeekByID } from '@cfFindState'
import { AppState, TWorkflow } from '@cfRedux/type'
import GridWeek from '@cfViews/GridView/GridWeek'
import { CfObjectType, ViewType } from '@cfModule/types/enum'

/**
 * Creates a grid with just nodes by week and their times
 */

type OwnProps = {
  // renderer: any
  view_type: ViewType
}
type ConnectedProps = {
  workflow: TWorkflow
  weeks: any[]
}

type StateType = {
  dropped_list: any[]
}
type PropsType = OwnProps & ConnectedProps
class GridViewUnconnected extends React.Component<PropsType, StateType> {
  private objectType: CfObjectType
  constructor(props: PropsType) {
    super(props)
    this.objectType = CfObjectType.WORKFLOW // @todo check addEditable
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
const GridView = connect<ConnectedProps, object, OwnProps, AppState>(
  mapStateToProps,
  null
)(GridViewUnconnected)

export default GridView
