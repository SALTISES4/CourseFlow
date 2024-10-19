import Loader from '@cfComponents/UIPrimitives/Loader'
import * as Constants from '@cfConstants'
import { WorkflowViewType } from '@cfPages/Workspace/Workflow/types'
import { SelectionManager } from '@cfRedux/utility/SelectionManager'
import ComparisonView from '@cfViews/ProjectComparisonView/ComparisonView'
import createCache from '@emotion/cache'
import { createTheme } from '@mui/material/styles'
import * as reactDom from 'react-dom'

const cache = createCache({
  key: 'emotion',
  nonce: window.cf_nonce
})

export class Comparison {
  private selectionManager: SelectionManager
  private readOnly: boolean
  private viewComments: boolean
  private addComments: boolean
  private viewType: WorkflowViewType
  private container: JQuery
  private projectData: any
  private userPermission: any

  constructor(props) {
    this.projectData = props.projectData
    this.userPermission = props.userPermission // @todo double check we're getting this from data object

    //@todo this a jquery global function and needs to be refactored / removed
    makeActiveSidebar('#project' + this.projectData.id)
  }

  // @todo as with Workflow component, calling this render function from a child component of
  // ComparisonView is an anti-pattern
  // render ComparisonView
  //  -- then pass a 'view type' state handler to the child
  //  -- not sure why there's a loader at level since we don't make a query here, but it can probably go
  //
  render(container, viewType = WorkflowViewType.WORKFLOW) {
    this.container = container
    this.viewType = viewType

    reactDom.render(<Loader />, container[0])

    switch (this.userPermission) {
      case Constants.permissionKeys['none']:
      case Constants.permissionKeys['view']:
        this.readOnly = true
        break

      case Constants.permissionKeys['comment']:
        this.readOnly = true
        this.viewComments = true
        this.addComments = true
        break

      case Constants.permissionKeys['edit']:
        this.readOnly = false
        this.viewComments = true
        this.addComments = true
        break
      default:
        break
    }

    this.selectionManager = new SelectionManager(this.readOnly)

    if (
      viewType === WorkflowViewType.WORKFLOW ||
      viewType === WorkflowViewType.OUTCOME_EDIT
    ) {
      const theme = createTheme({})
      reactDom.render(
        <ComparisonView
          viewType={viewType}
          container={this.container}
          parentRender={(a, b) => this.render(a, b)}
          readOnly={this.readOnly}
          projectData={this.projectData}
          selectionManager={this.selectionManager}
        />,
        container[0]
      )
    } else {
      console.log('comparsion view not supported ')
    }
  }
}

export default Comparison
