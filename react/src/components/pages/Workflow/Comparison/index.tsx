import React from 'react'
import * as reactDom from 'react-dom'
import WorkflowLoader from '@cfUIComponents/WorkflowLoader.jsx'
import { SelectionManager } from '@cfRedux/helpers'
import * as Constants from '@cfConstants'
import { ViewType } from '@cfModule/types/enum.js'
import ComparisonView from '@cfViews/ComparisonView/ComparisonView'
import { Project } from '@cfPages/Workflow/Workflow/types'

type ParamsType = {
  data: {
    project_data: Project
    is_strategy: boolean
    user_permission: number
    user_role: number
    public_view: boolean
    user_name: string
    user_id: number
    myColour: string
    changeFieldID: number
  }
}
export class WorkflowComparison {
  private selection_manager: SelectionManager
  private readOnly: boolean
  private viewComments: boolean
  private addComments: boolean
  private projectData: any
  private view_type: ViewType
  private container: JQuery
  private userPermission: any

  constructor(props: ParamsType) {
    this.projectData = props.data.project_data
    this.userPermission = props.data.user_permission // @todo double check we're getting this from data object

    //@todo this a jquery global function and needs to be refactored / removed
    makeActiveSidebar('#project' + this.projectData.id)
  }

  // @todo as with Workflow component, calling this render function from a child component of
  // ComparisonView is an anti-patterm
  // render ComparisonView
  //  -- then pass a 'view type' state handler to the child
  //  -- not sure why there's a loader at level since we don't make a query here, but it can probably go
  //
  render(container, view_type = ViewType.WORKFLOW) {
    this.container = container
    this.view_type = view_type

    reactDom.render(<WorkflowLoader />, container[0])

    switch (this.userPermission) {
      case Constants.permission_keys['none']:
      case Constants.permission_keys['view']:
        this.readOnly = true
        break

      case Constants.permission_keys['comment']:
        this.readOnly = true
        this.viewComments = true
        this.addComments = true
        break

      case Constants.permission_keys['edit']:
        this.readOnly = false
        this.viewComments = true
        this.addComments = true
        break
      default:
        break
    }

    this.selection_manager = new SelectionManager(this.readOnly)

    if (
      view_type === ViewType.WORKFLOW ||
      view_type === ViewType.OUTCOME_EDIT
    ) {
      reactDom.render(
        <ComparisonView
          view_type={view_type}
          // turn this into config object
          renderer={this}
          data={this.projectData}
          selection_manager={this.selection_manager}
        />,
        container[0]
      )
    }
  }
}

export default WorkflowComparison
