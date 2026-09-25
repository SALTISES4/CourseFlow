import { OuterContentWrap } from '@cfMUI/helper'
import { type WorkflowPageData } from '@cfPages/Workflow/types'

const OutcomeTableView = ({ workflow }: { workflow: WorkflowPageData }) => {
  console.log(workflow)

  return (
    <OuterContentWrap sx={{ pt: 4 }} data-test-id="workflow-outcome-table-view">
      <h1>Hello from the OutcomeTable view</h1>
    </OuterContentWrap>
  )
}

export default OutcomeTableView
