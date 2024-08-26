import * as React from 'react'
import CompetencyMatrixView from '@cfViews/Workflow/CompetencyMatrixView/CompetencyMatrixView'
import OutcomeTableView from '@cfViews/Workflow/OutcomeTableView/OutcomeTableView'

type PropsType = {
  data: any
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
      return <CompetencyMatrixView />
    }

    return <OutcomeTableView />
  }
}

export default WorkflowTableView
