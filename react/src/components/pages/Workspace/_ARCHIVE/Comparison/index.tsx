// @ts-nocheck
import React from 'react'
import * as reactDom from 'react-dom'
import Loader from '@cfCommonComponents/UIComponents/Loader.js'
import * as Constants from '@cfConstants'
import { ViewType } from '@cfModule/types/enum.js'
import ComparisonView from '@cfViews/ProjectComparisonView/ComparisonView'
import { SelectionManager } from '@cfRedux/utility/SelectionManager'
import { createTheme } from '@mui/material/styles'
import createCache from '@emotion/cache'

const cache = createCache({
  key: 'emotion',
  nonce: window.cf_nonce
})

export class Comparison {
  private selection_manager: SelectionManager
  private readOnly: boolean
  private viewComments: boolean
  private addComments: boolean
  private view_type: ViewType
  private container: JQuery
  private projectData: any
  private userPermission: any

  constructor(props: WorkflowComparisonViewDTO) {
    this.projectData = props.project_data
    this.userPermission = props.user_permission // @todo double check we're getting this from data object

    //@todo this a jquery global function and needs to be refactored / removed
    makeActiveSidebar('#project' + this.projectData.id)
  }

  // @todo as with Workflow component, calling this render function from a child component of
  // ComparisonView is an anti-pattern
  // render ComparisonView
  //  -- then pass a 'view type' state handler to the child
  //  -- not sure why there's a loader at level since we don't make a query here, but it can probably go
  //
  render(container, view_type = ViewType.WORKFLOW) {
    this.container = container
    this.view_type = view_type

    reactDom.render(<Loader />, container[0])

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
      const theme = createTheme({})
      reactDom.render(
        <ComparisonView
          view_type={view_type}
          container={this.container}
          parentRender={(a, b) => this.render(a, b)}
          read_only={this.readOnly}
          projectData={this.projectData}
          selection_manager={this.selection_manager}
        />,
        container[0]
      )
    } else {
      console.log('comparsion view not supported ')
    }
  }
}

export default Comparison
