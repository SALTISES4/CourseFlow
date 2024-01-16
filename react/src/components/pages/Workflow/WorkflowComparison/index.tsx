// @ts-nocheck
import React from 'react'
import * as reactDom from 'react-dom'
import WorkflowLoader from '@cfUIComponents/WorkflowLoader'
import * as Reducers from '@cfReducers'
import { Provider } from 'react-redux'
import WorkflowBase from '@cfViews/ComparisonView/WorkflowBase'
import * as Utility from '@cfUtility'
import { createStore } from '@reduxjs/toolkit'
import Workflow from '@cfPages/Workflow/Workflow'
import ActionCreator from '@cfRedux/ActionCreator'
import { ViewType } from '@cfModule/types/enum.js'

/****************************************
 *  @WorkflowComparisonRenderer
 * ****************************************/
export class WorkflowComparison extends Workflow {
  constructor(
    workflowID,
    data_package,
    container,
    selection_manager,
    tiny_loader,
    view_type,
    initial_object_sets
  ) {
    super(workflowID, data_package)
    this.selection_manager = selection_manager
    this.tiny_loader = tiny_loader
    this.container = container
    this.view_type = view_type
    this.initial_object_sets = initial_object_sets
  }

  render(view_type = ViewType.WORKFLOW) {
    this.view_type = view_type
    const store = this.store
    this.locks = {}
    const el = document.querySelector(this.container)

    reactDom.render(<WorkflowLoader />, el)

    if (view_type === ViewType.OUTCOME_EDIT) {
      // get additional data about parent workflow prior to render

      /**
       * @todo
       * so it seems like this is structured as a callback on the API async request only because OUTCOME_EDIT
       * is not the default 'view' state, see also the render function of the 'parent' workflow class
       * 1 - this request could be fired here perhaps, but WorkflowBase is called regardless, WorkflowBase must handle awating data
       * 2 - getWorkflowParentData (and all APIs) should have some async/await features, if we're not using react query hooks
       * 3 - finally view_type should be used as a state manager, which it is sort of inside the  <WorkflowBase
       * so that's fine, but not here where we decide to call queries
       *
       */
      this.getWorkflowParentData(this.workflowID, (response) => {
        store.dispatch(ActionCreator.refreshStoreData(response.data_package))
        reactDom.render(
          <Provider store={store}>
            {/*<WorkflowComparisonBaseView view_type={view_type} renderer={this} />*/}
            <WorkflowBase view_type={view_type} renderer={this} />
          </Provider>,
          el
        )
      })
    } else if (view_type === ViewType.WORKFLOW) {
      reactDom.render(
        <Provider store={this.store}>
          {/*<WorkflowComparisonBaseView view_type={view_type} renderer={this} />*/}
          <WorkflowBase view_type={view_type} renderer={this} />
        </Provider>,
        el
      )
    }
  }









  

  connection_opened(reconnect = false) {
    const loader = new Utility.Loader(this.container)
    this.getWorkflowData(this.workflowID, (response) => {
      let data_flat = response.data_package
      if (this.initial_object_sets) {
        data_flat = {
          ...data_flat,
          objectset: this.initial_object_sets
        }
      }
      this.store = createStore(Reducers.rootWorkflowReducer, data_flat)
      this.render(this.view_type)
      this.clear_queue(data_flat.workflow.edit_count)
      loader.endLoad()
      if (reconnect) {
        this.attempt_reconnect()
      }
    })
  }
}

export default WorkflowComparison
