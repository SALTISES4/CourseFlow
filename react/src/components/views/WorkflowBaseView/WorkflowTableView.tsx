import * as React from 'react'
import CompetencyMatrixView from '@cfViews/CompetencyMatrixView/CompetencyMatrixView'
import OutcomeTableView from '@cfViews/OutcomeTableView/OutcomeTableView'

/**
 * Just a quick way to decide which type of table to render
 */
class WorkflowTableView extends React.Component {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    if (data.table_type === 1)
      return (
        <CompetencyMatrixView
          view_type={this.props.view_type}
          renderer={this.props.renderer}
        />
      )
    else
      return (
        <OutcomeTableView
          view_type={this.props.view_type}
          renderer={this.props.renderer}
        />
      )
  }
}

export default WorkflowTableView
