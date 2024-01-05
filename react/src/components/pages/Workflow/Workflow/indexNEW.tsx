// @ts-nocheck
import React from 'react'
import * as reactDom from 'react-dom'
import { compose, createStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import * as Constants from '@cfConstants'
import { SelectionManager } from '@cfRedux/helpers'
import * as Reducers from '@cfReducers'
import {
  getPublicWorkflowChildData,
  getPublicWorkflowData,
  getPublicWorkflowParentData,
  getWorkflowChildData,
  getWorkflowParentData
} from '@XMLHTTP/PostFunctions'
import WorkflowLoader from '@cfUIComponents/WorkflowLoader'
import { WorkflowBaseView } from '@cfViews/WorkflowBaseView/WorkflowBaseView'
import { getWorkflowDataQuery, updateValueQuery } from '@XMLHTTP/APIFunctions'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'
// import theme from './mui/theme'

const cache = createCache({
  key: 'emotion',
  // @ts-ignore
  nonce: document.querySelector('#script-redesign').nonce
})

enum DATA_TYPE {
  WORKFLOW_ACTION = 'workflow_action',
  LOCK_UPDATE = 'lock_update',
  CONNECTION_UPDATE = 'connection_update',
  WORKFLOW_PARENT_UPDATED = 'workflow_parent_updated',
  WORKFLOW_CHILD_UPDATED = 'workflow_child_updated'
}

/****************************************
 *
 * ****************************************/
class Workflow {
  private message_queue: any[]
  private messages_queued: boolean
  private public_view: any
  private workflowID: any
  private column_choices: any
  private context_choices: any
  private task_choices: any
  private time_choices: any
  private outcome_type_choices: any
  private can_view: boolean
  private outcome_sort_choices: any
  private strategy_classification_choices: any
  private is_strategy: any
  private project: any

  constructor(props) {
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
    this.user_role = props.user_role
    this.user_id = props.user_id

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
        // nuclear fusion logic here
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

    if (this.public_view) {
      this.getWorkflowData = getPublicWorkflowData
      this.getWorkflowParentData = getPublicWorkflowParentData
      this.getWorkflowChildData = getPublicWorkflowChildData
    } else {
      this.getWorkflowData = getWorkflowDataQuery
      this.getWorkflowParentData = getWorkflowParentData
      this.getWorkflowChildData = getWorkflowChildData
    }

    this.messages_queued = true
    this.has_disconnected = false
  }

  /*******************************************************
   * WEBSOCKET MANAGER
   *******************************************************/
  connect() {
    const websocket_prefix =
      window.location.protocol === 'https:' ? 'wss' : 'ws'
    this.updateSocket = new WebSocket(
      `${websocket_prefix}://${window.location.host}/ws/update/${this.workflowID}/`
    )

    this.updateSocket.onmessage = (e) => {
      if (this.messages_queued) {
        this.message_queue.push(e)
      } else {
        this.onMessageReceived(e)
      }
    }

    this.updateSocket.onopen = () => {
      this.onConnectionOpened()
      this.has_rendered = true
    }

    this.updateSocket.onclose = (e) => this.handleSocketClose(e)
  }

  attempt_reconnect() {
    setTimeout(() => this.connect(), 30000)
  }

  handleSocketClose(e) {
    if (e.code === 1000) return
    this.onConnectionClosed()
    this.is_static = true
    this.has_disconnected = true
    this.attempt_reconnect()
  }

  connection_update_received() {
    console.log('A connection update was received, but not handled.')
  }

  clear_queue(edit_count) {
    // Flag to indicate if message processing should start
    let processMessages = false

    // Iterate over the message queue
    while (this.message_queue.length > 0) {
      const message = this.message_queue[0] // Get the first message

      if (processMessages) {
        // If processing started, parse each message
        this.parsemessage(message)
        this.message_queue.shift() // Remove the processed message
      } else if (
        message.edit_count &&
        parseInt(message.edit_count, 10) >= edit_count
      ) {
        // Start processing messages when the condition is met
        processMessages = true
      } else {
        // If the condition is not met, remove the message and continue
        this.message_queue.shift()
      }
    }

    // Reset the flag after processing the queue
    this.messages_queued = false
  }

  /*******************************************************
   * REACT TO MOVE
   *******************************************************/
  render(container, view_type = 'workflowview') {
    this.locks = {}

    this.selection_manager = new SelectionManager(this.read_only)

    // In case we need to get child workflows
    this.child_data_needed = []
    this.child_data_completed = -1
    this.fetching_child_data = false

    this.view_type = view_type

    reactDom.render(<WorkflowLoader />, container[0])

    this.container = container
    this.selection_manager.renderer = this

    if (view_type === 'outcomeedit') {
      // get additional data about parent workflow prior to render
      this.getWorkflowParentData(this.workflowID, (response) => {
        this.store.dispatch(Reducers.refreshStoreData(response.data_package))
        reactDom.render(
          <Provider store={this.store}>
            <WorkflowBaseView view_type={view_type} renderer={this} />
          </Provider>,
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
                <WorkflowBaseView view_type={view_type} renderer={this} />
              </Provider>
            </ThemeProvider>
          </CacheProvider>,
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
    this.getWorkflowData(this.workflowID, (response) => {
      const data_flat = response.data_package
      this.unread_comments = data_flat.unread_comments
      const composeEnhancers =
        window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
      this.store = createStore(
        Reducers.rootWorkflowReducer,
        data_flat,
        composeEnhancers()
      )
      this.render($('#container'))

      this.clear_queue(data_flat.workflow.edit_count)

      if (reconnect) {
        this.attempt_reconnect()
      }
    })
  }

  parsemessage = function (e) {
    const data = JSON.parse(e.data)
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

  parent_workflow_updated(edit_count) {
    this.messages_queued = true

    this.getWorkflowParentData(this.workflowID, (response) => {
      // remove all the parent node and parent workflow data
      this.store.dispatch(
        Reducers.replaceStoreData({
          parent_node: [],
          parent_workflow: []
        })
      )
      this.store.dispatch(Reducers.refreshStoreData(response.data_package))
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
      this.store.dispatch(Reducers.refreshStoreData(response.data_package))
      this.clear_queue(0)
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
    if (this.updateSocket) {
      this.updateSocket.send(
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
    updateValueQuery(id, object_type, json, true)
  }

  lock_update(obj, time, lock) {
    if (this.updateSocket) {
      this.updateSocket.send(
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
    const object_type = data.object_type
    const object_id = data.object_id

    if (!this.locks[object_type]) {
      this.locks[object_type] = {}
    }

    if (this.locks[object_type][object_id]) {
      clearTimeout(this.locks[object_type][object_id])
    }

    this.store.dispatch(
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
        this.store.dispatch(
          Reducers.createLockAction(object_id, object_type, false)
        )
      }, data.expires - Date.now())
    } else {
      this.locks[object_type][object_id] = null
    }
  }
}
export default Workflow
