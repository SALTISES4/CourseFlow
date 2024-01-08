// @ts-nocheck
import React from 'react'
import * as reactDom from 'react-dom'
import { Provider } from 'react-redux'
import * as Constants from '@cfConstants'
import { applyMiddleware, compose, createStore } from '@reduxjs/toolkit'
import { SelectionManager } from '@cfRedux/helpers'
import * as Reducers from '@cfReducers'
import {
  getPublicWorkflowChildDataQuery,
  getPublicWorkflowDataQuery,
  getPublicWorkflowParentDataQuery,
  getWorkflowChildDataQuery,
  getWorkflowParentDataQuery
} from '@XMLHTTP/PostFunctions'
import WorkflowLoader from '@cfUIComponents/WorkflowLoader'
import { WorkflowBaseView } from '@cfViews/WorkflowBaseView/WorkflowBaseView'
import {
  getWorkflowDataQuery,
  updateValueQuery as updateValue
} from '@XMLHTTP/APIFunctions'
import {
  Choice,
  Project,
  WorkflowDetailViewDTO
} from '@cfPages/Workflow/Workflow/types'
import { WorkflowDataQueryResp } from '@XMLHTTP/types'

enum DATA_TYPE {
  WORKFLOW_ACTION = 'workflow_action',
  LOCK_UPDATE = 'lock_update',
  CONNECTION_UPDATE = 'connection_update',
  WORKFLOW_PARENT_UPDATED = 'workflow_parent_updated',
  WORKFLOW_CHILD_UPDATED = 'workflow_child_updated'
}

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

/****************************************
 *
 * ****************************************/
class Workflow {
  private message_queue: any[]
  private messages_queued: boolean
  private public_view: boolean
  private workflowID: number
  // private column_choices: Choice[]
  // private context_choices: Choice[]
  // private task_choices: Choice[]
  // private time_choices: Choice[]
  // private outcome_type_choices: Choice[]
  // private outcome_sort_choices: Choice[]
  // private strategy_classification_choices: Choice[]
  private is_strategy: boolean
  private project: Project
  private user_permission: number
  private user_role: number
  private user_id: number
  private read_only: boolean
  private always_static: boolean
  private project_permission: number
  private can_view: boolean
  private view_comments: boolean
  private add_comments: boolean
  private is_student: boolean
  private show_assignments: boolean
  private is_teacher: boolean
  private websocket: WebSocket
  private selection_manager: SelectionManager
  private child_data_completed: boolean
  private child_data_needed: any[]
  private fetching_child_data: boolean
  private getWorkflowData: (
    workflowPk,
    callBackFunction?: (data: WorkflowDataQueryResp) => void
  ) => void
  private getWorkflowParentData: (
    workflowPk,
    callBackFunction?: (data: WorkflowDataQueryResp) => void
  ) => void
  private getWorkflowChildData: (
    workflowPk,
    callBackFunction?: (data: WorkflowDataQueryResp) => void
  ) => void

  constructor(props: WorkflowDetailViewDTO) {
    console.log('WF props')
    console.log(props)
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
    } = props.workflow_data_package

    this.message_queue = []
    this.messages_queued = true

    this.public_view = props.public_view
    this.workflowID = props.workflow_model_id

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

    this.user_permission = props.user_permission
    this.user_role = props.user_role ?? Constants.role_keys['none'] // @todo make sure this option is set in view
    this.user_id = props.user_id
    this.read_only = true
    if (this.public_view) {
      this.always_static = true
    }

    if (!this.is_strategy && this.project.object_permission) {
      this.project_permission = this.project.object_permission.permission_type
    }

    switch (props.user_permission) {
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

    switch (props.user_role) {
      case Constants.role_keys['none']:
        // @todo what is happening in this option?
        break

      case Constants.role_keys['student']:
        this.is_student = true
        this.show_assignments = true
        break

      case Constants.role_keys['teacher']:
        this.is_teacher = true
        this.show_assignments = true
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

  connect() {
    if (!this.always_static) {
      this.messages_queued = true
      const renderer = this

      let websocket_prefix
      if (window.location.protocol === 'https:') {
        websocket_prefix = 'wss'
      } else {
        websocket_prefix = 'ws'
      }

      const websocket = new WebSocket(
        websocket_prefix +
          '://' +
          window.location.host +
          '/ws/update/' +
          this.workflowID +
          '/'
      )
      this.websocket = websocket

      websocket.onmessage = function (e) {
        this.message_received(e)
      }.bind(this)

      const openfunction = function () {
        this.has_rendered = true
        this.connection_opened()
      }

      websocket.onopen = openfunction.bind(this)

      if (websocket.readyState === 1) {
        openfunction.bind(this)()
      }

      websocket.onclose = function (e) {
        if (e.code === 1000) {
          return
        }

        if (!renderer.has_rendered) {
          renderer.connection_opened(true)
        } else {
          renderer.attempt_reconnect()
        }

        renderer.is_static = true
        renderer.has_rendered = true

        if (!renderer.silent_connect_fail && !renderer.has_disconnected) {
          alert(
            window.gettext(
              'Unable to establish connection to the server, or connection has been lost.'
            )
          )
        }
        renderer.has_disconnected = true
      }
    } else {
      this.connection_opened()
    }
  }

  render(container, view_type = 'workflowview') {
    this.selection_manager = new SelectionManager(this.read_only)

    // In case we need to get child workflows
    this.child_data_needed = []
    this.child_data_completed = -1
    this.fetching_child_data = false

    this.view_type = view_type

    console.log('workdflow render contiainer')
    console.log(container[0])

    reactDom.render(<WorkflowLoader />, container[0])
    const store = this.store
    const initial_workflow_data = store.getState()
    const renderer = this
    this.container = container
    this.locks = {}

    this.selection_manager.renderer = renderer

    if (view_type === 'outcomeedit') {
      // get additional data about parent workflow prior to render
      this.getWorkflowParentData(this.workflowID, (response) => {
        store.dispatch(Reducers.refreshStoreData(response.data_package))
        reactDom.render(
          <Provider store={store}>
            <WorkflowBaseView view_type={view_type} renderer={this} />
          </Provider>,
          container[0]
        )
      })
    } else if (
      view_type === 'horizontaloutcometable' ||
      view_type === 'alignmentanalysis'
    ) {
      // get additional data about child workflows to render in later
      const node_ids = [
        ...new Set(
          initial_workflow_data.node
            .filter((x) => !x.deleted && x.linked_workflow)
            .map((node) => node.id)
        )
      ]

      setTimeout(() => {
        reactDom.render(
          <Provider store={store}>
            <WorkflowBaseView view_type={view_type} renderer={this} />
          </Provider>,
          container[0]
        )
      }, 50)
    } else if (view_type === 'outcometable') {
      // TODO: This doesn't differ at all from the "else" statement below
      setTimeout(() => {
        reactDom.render(
          <Provider store={this.store}>
            <WorkflowBaseView view_type={view_type} renderer={this} />
          </Provider>,
          container[0]
        )
      }, 50)
    } else {
      setTimeout(() => {
        reactDom.render(
          <Provider store={this.store}>
            <WorkflowBaseView view_type={view_type} renderer={this} />
          </Provider>,
          container[0]
        )
      }, 50)
    }
  }

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
        this.store.dispatch(Reducers.refreshStoreData(response.data_package))
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
    console.log('connection_opened')
    this.getWorkflowData(this.workflowID, (response) => {
      this.unread_comments = response.data_package?.unread_comments // @todo explicit typing

      this.store = createStore(
        Reducers.rootWorkflowReducer,
        response.data_package,
        composeEnhancers()
      )
      this.render($('#container'))

      this.clear_queue(response.data_package?.workflow.edit_count)

      if (reconnect) {
        this.attempt_reconnect()
      }
    })
  }

  attempt_reconnect() {
    const renderer = this
    setTimeout(() => {
      renderer.connect()
    }, 30000)
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

  parsemessage = function (e) {
    const data = JSON.parse(e.data)
    console.log('parsemessage')
    console.log(data)
    switch (data.type) {
      case DATA_TYPE.WORKFLOW_ACTION:
        this.store.dispatch(data.action)
        break
      case DATA_TYPE.LOCK_UPDATE:
        this.lock_update_received(data.action)
        break
      case DATA_TYPE.CONNECTION_UPDATE:
        this.connection_update_received(data.action)
        break
      case DATA_TYPE.WORKFLOW_PARENT_UPDATED:
        this.parent_workflow_updated(data.edit_count)
        break
      case DATA_TYPE.WORKFLOW_CHILD_UPDATED:
        this.child_workflow_updated(data.edit_count, data.child_workflow_id)
        break
      default:
        break
    }
  }

  connection_update_received() {
    console.log('A connection update was received, but not handled.')
  }

  parent_workflow_updated(edit_count) {
    this.messages_queued = true
    const renderer = this
    this.getWorkflowParentData(this.workflowID, (response) => {
      // remove all the parent node and parent workflow data
      renderer.store.dispatch(
        Reducers.replaceStoreData({
          parent_node: [],
          parent_workflow: []
        })
      )
      renderer.store.dispatch(Reducers.refreshStoreData(response.data_package))
      renderer.clear_queue(0)
    })
  }

  child_workflow_updated(edit_count, child_workflow_id) {
    this.messages_queued = true
    const renderer = this
    const state = this.store.getState()
    const node = state.node.find(
      (node) => node.linked_workflow == child_workflow_id
    )

    if (!node) {
      return
    }

    this.getWorkflowChildData(node.id, (response) => {
      renderer.store.dispatch(Reducers.refreshStoreData(response.data_package))
      renderer.clear_queue(0)
    })
  }

  message_received(e) {
    if (this.messages_queued) {
      this.message_queue.push(e)
    } else {
      this.parsemessage(e)
    }
  }

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

  change_field(id, object_type, field, value) {
    const json = {}
    json[field] = value
    this.store.dispatch(Reducers.changeField(id, object_type, json))
    updateValue(id, object_type, json, true)
  }

  lock_update(obj, time, lock) {
    if (this.websocket) {
      this.websocket.send(
        JSON.stringify({
          type: 'lock_update',
          lock: {
            ...obj,
            expires: Date.now() + time,
            user_id: this.user_id,
            user_colour: COURSEFLOW_APP.contextData.myColour,
            lock: lock
          }
        })
      )
    }
  }

  lock_update_received(data) {
    const store = this.store
    const object_type = data.object_type
    const object_id = data.object_id

    if (!this.locks[object_type]) {
      this.locks[object_type] = {}
    }

    if (this.locks[object_type][object_id]) {
      clearTimeout(this.locks[object_type][object_id])
    }

    store.dispatch(
      Reducers.createLockAction(
        object_id,
        object_type,
        data.lock,
        data.user_id,
        data.user_colour
      )
    )

    if (data.lock) {
      this.locks[object_type][object_id] = setTimeout(() => {
        store.dispatch(Reducers.createLockAction(object_id, object_type, false))
      }, data.expires - Date.now())
    } else {
      this.locks[object_type][object_id] = null
    }
  }
}
export default Workflow
