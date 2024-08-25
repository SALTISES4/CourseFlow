import * as React from 'react'
import CompetencyMatrixView from '@cfViews/Workflow/CompetencyMatrixView/CompetencyMatrixView'
import OutcomeTableView from '@cfViews/Workflow/OutcomeTableView/OutcomeTableView'
import { ViewType } from '@cfModule/types/enum'

type PropsType = {
  data: any
  view_type: ViewType // should this come from
}
/**
 * Just a quick way to decide which type of table to render
 */
class WorkflowTableView extends React.Component<PropsType> {
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.data
    if (data.table_type === 1) {
      return (
        <CompetencyMatrixView
          view_type={this.props.view_type}
          // renderer={this.props.renderer}
        />
      )
    }

    return (
      <OutcomeTableView
        view_type={this.props.view_type}
        //  renderer={this.props.renderer}
      />
    )
  }
}

export default WorkflowTableView
