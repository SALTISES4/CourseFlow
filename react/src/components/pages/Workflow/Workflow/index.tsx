import React from 'react'
import * as reactDom from 'react-dom'
import { Provider } from 'react-redux'
import * as Constants from '@cfConstants'
import {
  AnyAction,
  compose,
  createStore,
  EmptyObject,
  Store
} from '@reduxjs/toolkit'

import WorkflowLoader from '@cfUIComponents/WorkflowLoader'
import WorkflowBaseView from '@cfViews/WorkflowBaseView/WorkflowBaseView'
import { WorkflowDetailViewDTO } from '@cfPages/Workflow/Workflow/types'
import {
  WorkflowDataQueryResp,
  WorkflowChildDataQueryResp,
  WorkflowParentDataQueryResp
} from '@XMLHTTP/types/query'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { AppState } from '@cfRedux/types/type'
import ActionCreator from '@cfRedux/ActionCreator'
import { ViewType } from '@cfModule/types/enum'
import {
  getPublicWorkflowParentDataQuery,
  getWorkflowParentDataQuery
} from '@XMLHTTP/API/workflow'
import WorkFlowConfigProvider from '@cfModule/context/workFlowConfigContext'
import { SelectionManager } from '@cfRedux/utility/SelectionManager'
import { EProject } from '@XMLHTTP/types/entity'
import { FieldChoice } from '@cfModule/types/common'
import WebsocketManager from '@cfPages/Workflow/Workflow/websocketManager'
// import $ from 'jquery'

const cache = createCache({
  key: 'emotion',
  nonce: window.cf_nonce
})

/****************************************
 *
 * ****************************************/
class Workflow extends React.Component {
  // private message_queue: any[]
  // private messages_queued: boolean
  // private outcome_type_choices: FieldChoice[]
  outcome_sort_choices: FieldChoice[]
  // private user_permission: number
  // private user_role: number
  // private is_teacher: boolean
  public_view: boolean
  workflowID: number
  column_choices: FieldChoice[]
  context_choices: FieldChoice[]
  task_choices: FieldChoice[]
  time_choices: FieldChoice[]
  strategy_classification_choices: FieldChoice[]
  is_strategy: boolean
  project: EProject
  user_id: number
  read_only: boolean
  always_static: boolean // refers to whether we are anonymous / public view or not so likely refers to the non pubsub based workflow
  project_permission: number
  can_view: boolean
  view_comments: boolean
  add_comments: boolean
  is_student: boolean
  selection_manager: SelectionManager
  // private child_data_completed: number
  // private child_data_needed: any[]
  // private fetching_child_data: boolean
  protected getWorkflowData: (
    workflowPk,
    callBackFunction?: (data: WorkflowDataQueryResp) => void
  ) => void
  protected getWorkflowParentData: (
    workflowPk,
    callBackFunction?: (data: WorkflowParentDataQueryResp) => void
  ) => void
  private getWorkflowChildData: (
    workflowPk,
    callBackFunction?: (data: WorkflowChildDataQueryResp) => void
  ) => void
  websocket: WebsocketManager
  // private has_disconnected: boolean
  // private has_rendered: boolean
  // private is_static: boolean
  protected store: Store<EmptyObject & AppState, AnyAction>

  // NOTE: this is not yet a React component, so its misleading to use the same
  // 'props' value in the constructor since they behave differently
  unread_comments: any
  container: any
  view_type: any
  private workflowRender: OmitThisParameter<
    (container, view_type?: ViewType) => void
  >
  // private locks: any

  constructor(propsConfig: WorkflowDetailViewDTO) {
    super(propsConfig)
    const {
      column_choices,
      context_choices,
      task_choices,
      time_choices,
      // outcome_type_choices,
      outcome_sort_choices,
      strategy_classification_choices,
      is_strategy,
      project
    } = propsConfig.workflow_data_package

    this.public_view = propsConfig.public_view
    this.workflowID = propsConfig.workflow_model_id

    // Data package
    this.column_choices = column_choices
    this.context_choices = context_choices
    this.task_choices = task_choices
    this.time_choices = time_choices
    // this.outcome_type_choices = outcome_type_choices
    this.outcome_sort_choices = outcome_sort_choices
    this.strategy_classification_choices = strategy_classification_choices

    this.is_strategy = is_strategy
    this.project = project

    // this.user_permission = propsConfig.user_permission
    this.user_id = propsConfig.user_id
    this.read_only = true
    this.workflowRender = this.render.bind(this)

    // if (this.public_view) {
    //   this.always_static = true
    // }

    if (!this.is_strategy && this.project.object_permission) {
      this.project_permission = this.project.object_permission.permission_type
    }

    switch (propsConfig.user_permission) {
      case Constants.permission_keys['view']:
        this.can_view = true
        break

      case Constants.permission_keys['comment']:
        this.view_comments = true
        this.add_comments = true
        this.can_view = true
        break

      case Constants.permission_keys['edit']:
        this.read_only = false
        this.view_comments = true
        this.add_comments = true
        this.can_view = true
        break

      // No default case needed here if these are the only options
    }

    /*******************************************************
     * here is a switch which seems to call the same REST endpoint
     * with the same data response
     * but a 'public version' which has some sorts of retrictions put on it
     * access (?) / rate limiting by IP  (?)
     *
     * this can stay for now, but the logic should be transparent to the client
     *
     *******************************************************/

    // this.getWorkflowData = this.public_view
    //   ? getPublicWorkflowDataQuery
    //   : getWorkflowDataQuery
    this.getWorkflowParentData = this.public_view
      ? getPublicWorkflowParentDataQuery
      : getWorkflowParentDataQuery
    // this.getWorkflowChildData = this.public_view
    //   ? getPublicWorkflowChildDataQuery
    //   : getWorkflowChildDataQuery

    this.websocket = new WebsocketManager(propsConfig)
    this.websocket.init()
  }

  //

  /*******************************************************
   * REACT TO MOVE
   *******************************************************/
  // render(container, view_type: ViewType = ViewType.WORKFLOW) {
  render() {
    //    this.locks = {}

    this.selection_manager = new SelectionManager(this.read_only)

    // In case we need to get child workflows
    // this.child_data_needed = []
    // this.child_data_completed = -1
    // this.fetching_child_data = false

    // this.view_type = view_type // @todo where is view_type set?
    this.view_type = ViewType.WORKFLOW // @todo where is view_type set?

    // reactDom.render(<WorkflowLoader />, container[0])

    // this.container = container // @todo where is view_type set?
    // this.selection_manager.renderer = this // @todo explicit props, renderer does not exist on selection_manager

    if (this.view_type === ViewType.OUTCOME_EDIT) {
      // get additional data about parent workflow prior to render
      this.getWorkflowParentData(this.workflowID, (response) => {
        this.store.dispatch(
          ActionCreator.refreshStoreData(response.data_package)
        )
        return (
          <Provider store={this.store}>
            <WorkFlowConfigProvider initialValue={this}>
              <WorkflowBaseView
                view_type={this.view_type}
                parentRender={this.workflowRender}
                config={{
                  canView: this.can_view,
                  isStudent: this.is_student,
                  projectPermission: this.project_permission,
                  alwaysStatic: this.always_static
                }}
                //  websocket={this.websocket}
              />
            </WorkFlowConfigProvider>
          </Provider>
        )
      })
    } else {
      return (
        <Provider store={this.store}>
          <WorkFlowConfigProvider initialValue={this}>
            <WorkflowBaseView
              view_type={this.view_type}
              parentRender={this.workflowRender}
              config={{
                canView: this.can_view,
                isStudent: this.is_student,
                projectPermission: this.project_permission,
                alwaysStatic: this.always_static
              }}
              // websocket={this.websocket}
            />
          </WorkFlowConfigProvider>
        </Provider>
      )
    }
  }
}

export default Workflow
