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
import * as Reducers from '@cfReducers'
import Loader from '@cfCommonComponents/UIComponents/Loader'
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
  getPublicWorkflowChildDataQuery,
  getPublicWorkflowDataQuery,
  getPublicWorkflowParentDataQuery,
  getWorkflowChildDataQuery,
  getWorkflowDataQuery,
  getWorkflowParentDataQuery
} from '@XMLHTTP/API/workflow'
import { updateValueQuery } from '@XMLHTTP/API/update'
import WorkFlowConfigProvider from '@cfModule/context/workFlowConfigContext'
import { SelectionManager } from '@cfRedux/utility/SelectionManager'
import { EProject } from '@XMLHTTP/types/entity'
import { FieldChoice } from '@cfModule/types/common'
// import $ from 'jquery'

const cache = createCache({
  key: 'emotion',
  nonce: window.cf_nonce
})

enum DATA_TYPE {
  WORKFLOW_ACTION = 'workflow_action',
  LOCK_UPDATE = 'lock_update',
  CONNECTION_UPDATE = 'connection_update',
  WORKFLOW_PARENT_UPDATED = 'workflow_parent_updated',
  WORKFLOW_CHILD_UPDATED = 'workflow_child_updated'
}

// @ts-ignore
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

/****************************************
 *
 * ****************************************/
class Workflow {
  private message_queue: any[]
  private messages_queued: boolean
  private outcome_type_choices: FieldChoice[]
  outcome_sort_choices: FieldChoice[]
  private user_permission: number
  private user_role: number
  private is_teacher: boolean
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
  connection_update_receiver: null | ((data: any) => void)
  private child_data_completed: number
  private child_data_needed: any[]
  private fetching_child_data: boolean
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
  websocket: WebSocket
  private has_disconnected: boolean
  private has_rendered: boolean
  private is_static: boolean
  store: Store<EmptyObject & AppState, AnyAction>

  // NOTE: this is not yet a React component, so its misleading to use the same
  // 'props' value in the constructor since they behave differently
  unread_comments: any
  container: any
  view_type: any
  private workflowRender: OmitThisParameter<
    (container, view_type?: ViewType) => void
  >
  private locks: any
  silent_connect_fail: any

  constructor(propsConfig: WorkflowDetailViewDTO) {
    const {
      column_choices,
      context_choices,
      task_choices,
      time_choices,
      outcome_type_choices,
      outcome_sort_choices,
      strategy_classification_choices,
      is_strategy,
      project
    } = propsConfig.workflow_data_package

    this.message_queue = []
    this.messages_queued = true
    this.connection_update_receiver = null

    this.public_view = propsConfig.public_view
    this.workflowID = propsConfig.workflow_model_id

    // Data package
    this.column_choices = column_choices
    this.context_choices = context_choices
    this.task_choices = task_choices
    this.time_choices = time_choices
    this.outcome_type_choices = outcome_type_choices
    this.outcome_sort_choices = outcome_sort_choices
    this.strategy_classification_choices = strategy_classification_choices

    this.is_strategy = is_strategy
    this.project = project

    this.user_permission = propsConfig.user_permission
    this.user_id = propsConfig.user_id
    this.read_only = true
    this.workflowRender = this.render.bind(this)

    if (this.public_view) {
      this.always_static = true
    }

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

    this.getWorkflowData = this.public_view
      ? getPublicWorkflowDataQuery
      : getWorkflowDataQuery
    this.getWorkflowParentData = this.public_view
      ? getPublicWorkflowParentDataQuery
      : getWorkflowParentDataQuery
    this.getWorkflowChildData = this.public_view
      ? getPublicWorkflowChildDataQuery
      : getWorkflowChildDataQuery
  }

  //
  init() {
    if (!this.always_static) {
      this.connect()
    } else {
      this.connection_opened()
    }
  }

  /*******************************************************
   * WEBSOCKET MANAGER
   *******************************************************/
  connect() {
    const websocket_prefix =
      window.location.protocol === 'https:' ? 'wss' : 'ws'
    this.websocket = new WebSocket(
      `${websocket_prefix}://${window.location.host}/ws/update/${this.workflowID}/`
    )

    this.websocket.onmessage = (e) => {
      if (this.messages_queued) {
        this.message_queue.push(e)
      } else {
        this.onMessageReceived(e)
      }
    }

    this.websocket.onopen = () => {
      this.has_rendered = true
      this.connection_opened()
    }

    // @todo why?
    if (this.websocket.readyState === 1) {
      this.connection_opened()
    }

    this.websocket.onclose = (e) => this.handleSocketClose(e)
  }

  handleSocketClose(e: CloseEvent) {
    if (e.code === 1000) return

    if (!this.has_rendered) {
      this.connection_opened(true)
    } else {
      this.attemptReconnect()
    }

    this.is_static = true
    this.has_disconnected = true
    this.has_rendered = true

    if (!this.silent_connect_fail && !this.has_disconnected) {
      alert(
        window.gettext(
          'Unable to establish connection to the server, or connection has been lost.'
        )
      )
    }
  }

  attemptReconnect() {
    setTimeout(() => this.init(), 30000)
  }

  onMessageReceived(e: MessageEvent) {
    this.parsemessage(e)
  }

  /*******************************************************
   * // WEBSOCKET MANAGER
   *******************************************************/

  // Fetches the data for the given child workflow
  getDataForChildWorkflow() {
    if (this.child_data_completed === this.child_data_needed.length - 1) {
      this.fetching_child_data = false
      return
    }

    this.fetching_child_data = true
    this.child_data_completed++
    this.getWorkflowChildData(
      this.child_data_needed[this.child_data_completed],
      (response) => {
        this.store.dispatch(
          ActionCreator.refreshStoreData(response.data_package)
        )
        setTimeout(() => this.getDataForChildWorkflow(), 50)
      }
    )
  }

  // Lets the renderer know that it must load the child data for that workflow
  childWorkflowDataNeeded(node_id) {
    if (this.child_data_needed.indexOf(node_id) < 0) {
      this.child_data_needed.push(node_id)
      if (!this.fetching_child_data) {
        setTimeout(() => this.getDataForChildWorkflow(), 50)
      }
    }
  }

  connection_opened(reconnect = false) {
    this.getWorkflowData(this.workflowID, (response) => {
      this.unread_comments = response.data_package?.unread_comments // @todo explicit typing

      this.store = createStore(
        Reducers.rootWorkflowReducer,
        // @ts-ignore @todo check out data_package type
        response.data_package,
        composeEnhancers()
      )
      this.render($('#container'))

      // @ts-ignore
      this.clear_queue(response.data_package?.workflow.edit_count) // @todo why would there be a queue if we're not using pubsub?

      if (reconnect) {
        // @ts-ignore
        this.attempt_reconnect() // @todo why would we try to reconnect if we're not using pubsub?
      }
    })
  }

  clear_queue(edit_count) {
    let started_edits = false
    while (this.message_queue.length > 0) {
      const message = this.message_queue[0]
      if (started_edits) {
        this.parsemessage(message)
      } else if (
        message.edit_count &&
        parseInt(message.edit_count) >= edit_count
      ) {
        started_edits = true
        this.message_queue.splice(0, 1)
      }
    }

    this.messages_queued = false
  }

  /*******************************************************
   * THESE ARE UPDATES FROM PUB MESSAGE
   *******************************************************/
  parsemessage(e) {
    const data = JSON.parse(e.data)

    switch (data.type) {
      case DATA_TYPE.WORKFLOW_ACTION:
        console.log('an action just came in', data)
        this.store.dispatch(data.action)
        break
      case DATA_TYPE.LOCK_UPDATE:
        this.lock_update_received(data.action)
        break
      case DATA_TYPE.CONNECTION_UPDATE:
        this.connection_update_received(data.action)
        break
      case DATA_TYPE.WORKFLOW_PARENT_UPDATED:
        // this.parent_workflow_updated(data.edit_count) // @todo function takes no args
        this.parent_workflow_updated()
        break
      case DATA_TYPE.WORKFLOW_CHILD_UPDATED:
        this.child_workflow_updated(data.edit_count, data.child_workflow_id)
        break
      default:
        break
    }
  }

  lock_update_received(data) {
    const object_type = data.object_type
    const object_id = data.object_id

    if (!this.locks[object_type]) {
      this.locks[object_type] = {}
    }

    if (this.locks[object_type][object_id]) {
      clearTimeout(this.locks[object_type][object_id])
    }

    this.store.dispatch(
      ActionCreator.createLockAction(
        object_id,
        object_type,
        data.lock,
        data.user_id,
        data.user_colour
      )
    )

    if (data.lock) {
      this.locks[object_type][object_id] = setTimeout(() => {
        this.store.dispatch(
          ActionCreator.createLockAction(object_id, object_type, false)
        )
      }, data.expires - Date.now())
    } else {
      this.locks[object_type][object_id] = null
    }
  }

  // @todo this is weird becuase connection_update_received is called in
  // connectedUsers but expects data to be well defined
  connection_update_received(data) {
    if (this.connection_update_receiver) {
      this.connection_update_receiver(data)
    } else {
      console.log('A connection update was received, but not handled.')
    }
  }

  connect_user_bar(connection_update_receiver) {
    this.connection_update_receiver = connection_update_receiver
  }

  parent_workflow_updated() {
    this.messages_queued = true
    this.getWorkflowParentData(this.workflowID, (response) => {
      // remove all the parent node and parent workflow data
      this.store.dispatch(
        ActionCreator.replaceStoreData({
          parent_node: [],
          parent_workflow: []
        })
      )
      this.store.dispatch(ActionCreator.refreshStoreData(response.data_package))
      this.clear_queue(0)
    })
  }

  child_workflow_updated(edit_count, child_workflow_id) {
    this.messages_queued = true
    const state = this.store.getState()
    const node = state.node.find(
      (node) => node.linked_workflow == child_workflow_id
    )

    if (!node) {
      return
    }

    this.getWorkflowChildData(node.id, (response) => {
      this.store.dispatch(ActionCreator.refreshStoreData(response.data_package))
      this.clear_queue(0)
    })
  }

  /*******************************************************
   * END PARSE MESSAGE LOGIC
   *******************************************************/

  // @todo how used?
  micro_update(obj) {
    if (this.websocket) {
      this.websocket.send(
        JSON.stringify({
          type: 'micro_update',
          action: obj
        })
      )
    }
  }

  // @todo where used?
  change_field(id, object_type, field, value) {
    const json = {}
    json[field] = value
    this.store.dispatch(ActionCreator.changeField(id, object_type, json))
    updateValueQuery(id, object_type, json, true)
  }

  //Called by the selection manager and during drag events to
  //lock an object, indicating it should not be selectable
  //by any other users
  lock_update(obj, time, lock) {
    if (this.websocket) {
      this.websocket.send(
        JSON.stringify({
          type: 'lock_update',
          lock: {
            ...obj,
            expires: Date.now() + time,
            user_id: this.user_id,
            // @ts-ignore
            user_colour: COURSEFLOW_APP.contextData.myColour,
            lock: lock
          }
        })
      )
    }
  }

  /*******************************************************
   * REACT TO MOVE
   *******************************************************/
  render(container, view_type: ViewType = ViewType.WORKFLOW) {
    console.log('THIS IS THE WORKFLOW TI', this.project)
    this.locks = {}

    this.selection_manager = new SelectionManager(this.read_only)

    // In case we need to get child workflows
    this.child_data_needed = []
    this.child_data_completed = -1
    this.fetching_child_data = false

    this.view_type = view_type // @todo where is view_type set?

    reactDom.render(<Loader />, container[0])

    this.container = container // @todo where is view_type set?
    // this.selection_manager.renderer = this // @todo explicit props, renderer does not exist on selection_manager

    if (view_type === ViewType.OUTCOME_EDIT) {
      // get additional data about parent workflow prior to render
      this.getWorkflowParentData(this.workflowID, (response) => {
        this.store.dispatch(
          ActionCreator.refreshStoreData(response.data_package)
        )
        const theme = createTheme({})
        reactDom.render(
          <CacheProvider value={cache}>
            <ThemeProvider theme={theme}>
              <Provider store={this.store}>
                <WorkFlowConfigProvider initialValue={this}>
                  <WorkflowBaseView
                    view_type={view_type}
                    parentRender={this.workflowRender}
                    config={{
                      canView: this.can_view,
                      isStudent: this.is_student,
                      projectPermission: this.project_permission,
                      alwaysStatic: this.always_static
                    }}
                    websocket={this.websocket}
                  />
                </WorkFlowConfigProvider>
              </Provider>
            </ThemeProvider>
          </CacheProvider>,
          container[0]
        )
      })
    } else {
      setTimeout(() => {
        const theme = createTheme({})
        reactDom.render(
          <CacheProvider value={cache}>
            <ThemeProvider theme={theme}>
              <Provider store={this.store}>
                <WorkFlowConfigProvider initialValue={this}>
                  <WorkflowBaseView
                    view_type={view_type}
                    parentRender={this.workflowRender}
                    config={{
                      canView: this.can_view,
                      isStudent: this.is_student,
                      projectPermission: this.project_permission,
                      alwaysStatic: this.always_static
                    }}
                    websocket={this.websocket}
                  />
                </WorkFlowConfigProvider>
              </Provider>
            </ThemeProvider>
          </CacheProvider>,
          container[0]
        )
      }, 50)
    }
  }
}

export default Workflow
