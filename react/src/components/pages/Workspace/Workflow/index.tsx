import React from 'react'
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
import WorkflowBaseView from '@cfViews/Workflow/WorkflowBaseView/WorkflowBaseView'
import { WorkflowDetailViewDTO } from '@cfPages/Workspace/Workflow/types'
import { AppState } from '@cfRedux/types/type'
import ActionCreator from '@cfRedux/ActionCreator'
import { ViewType } from '@cfModule/types/enum'
import {
  getWorkflowById,
  getWorkflowChildDataQuery,
  getWorkflowDataQuery,
  getWorkflowParentDataQuery
} from '@XMLHTTP/API/workflow'
import { updateValueQuery } from '@XMLHTTP/API/update'
import WorkFlowConfigProvider from '@cfModule/context/workFlowConfigContext'
import { SelectionManager } from '@cfRedux/utility/SelectionManager'
import { EProject } from '@XMLHTTP/types/entity'
import { FieldChoice } from '@cfModule/types/common'
import { WebSocketService } from '@cfModule/HTTP/WebSocketService'
import legacyWithRouter from '@cfModule/HOC/legacyWithRouter'
import { RouterProps } from 'react-router'
import WebSocketServiceConnectedUserManager, {
  ConnectedUser
} from '@cfModule/HTTP/WebsocketServiceConnectedUserManager'

enum DATA_TYPE {
  WORKFLOW_ACTION = 'workflow_action',
  LOCK_UPDATE = 'lock_update',
  CONNECTION_UPDATE = 'connection_update',
  WORKFLOW_PARENT_UPDATED = 'workflow_parent_updated',
  WORKFLOW_CHILD_UPDATED = 'workflow_child_updated'
}

type StateProps = {
  connectedUsers: ConnectedUser[]
  wsConnected: boolean
  ready: boolean
  viewType: ViewType
}
type PropsType = Record<string, never>

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

/****************************************
 * this is a copy of the original Workflow/Workflow
 * workflow needs to be overhauled, but Comparison/ calls ComparisonView calls, WorkflowComparisonRendererComponent calls WorkflowComparison
 * which extends the original Workflow/Workflow....
 * the hope is that there unpacking this will be less work when Workflow/Workflow is revised first
 * ****************************************/
class Workflow extends React.Component<PropsType & RouterProps, StateProps> {
  private messageQueue: any[]
  private isMessagesQueued: boolean
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
  user_name: string
  read_only: boolean
  always_static: boolean // refers to whether we are anonymous / public view or not so likely refers to the non pubsub based workflow
  project_permission: number
  can_view: boolean
  view_comments: boolean
  add_comments: boolean
  is_student: boolean
  selection_manager: SelectionManager
  private child_data_completed: number
  private child_data_needed: any[]
  private fetching_child_data: boolean
  websocket: WebSocket
  private has_disconnected: boolean
  private has_rendered: boolean
  store: Store<EmptyObject & AppState, AnyAction>
  wsManager: WebSocketServiceConnectedUserManager

  unread_comments: any
  container: any
  view_type: ViewType
  protected locks: any
  private websocketService: WebSocketService

  constructor(props: PropsType & RouterProps) {
    super(props)

    this.state = {
      wsConnected: false,
      connectedUsers: [],
      ready: false,
      viewType: ViewType.WORKFLOW
    }

    this.isMessagesQueued = true // why would this be true right away?
    this.messageQueue = []
    this.updateView = this.updateView.bind(this)
  }

  componentDidMount() {
    const { id } = this.props.params
    this.workflowID = id

    // Begin websocket connection manager
    const url = `ws/update/${this.workflowID}/`
    this.websocketService = new WebSocketService(url)

    this.websocketService.connect(
      this.onMessageReceived.bind(this),
      this.onConnectionOpened.bind(this),
      this.handleSocketClose.bind(this)
    )

    // Begin connected user manager
    this.wsManager = new WebSocketServiceConnectedUserManager(
      this.props.websocket,
      this.handleConnectedUsersUpdate.bind(this)
    )
    this.wsManager.startUserUpdates()

    // fetch the basic workflow data by id set in URL
    getWorkflowById(String(this.workflowID)).then((response) => {
      this.setupData(response.data_package)
      // this.init()
    })
  }

  componentWillUnmount() {
    this.websocketService.disconnect()
  }

  setupData(response: WorkflowDetailViewDTO) {
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
    } = response.workflow_data_package

    this.selection_manager = new SelectionManager(this.read_only)

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

    this.user_id = response.user_id
    this.user_name = response.user_name

    // permissions
    this.user_permission = response.user_permission
    this.read_only = true
    this.always_static = false
    this.public_view = response.public_view

    if (this.public_view) {
      this.always_static = true
    }

    if (!this.is_strategy && this.project.object_permission) {
      this.project_permission = this.project.object_permission.permission_type
    }

    switch (response.user_permission) {
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
  }

  updateView(viewType: ViewType) {
    this.setState({
      ...this.state,
      viewType
    })
  }

  /*******************************************************
   * WEBSOCKET HANDLERS
   *******************************************************/
  onConnectionOpened(reconnect = false) {
    // as soon as the socket connection is opened, fetch the 'additional workflow data query'
    // put it in redux store, and indicate that we're ready to render / done loading
    // Q: do we have race condition with main parent 'get workflow data'
    // Q: why are these separate, and how can they be better defined?
    getWorkflowDataQuery(this.workflowID, (response) => {
      this.unread_comments = response.data_package?.unread_comments // @todo do not assign this explicitly here, not seeing this in data package yet

      this.store = createStore(
        Reducers.rootWorkflowReducer,
        response.data_package,
        composeEnhancers()
      )

      this.setState({
        ...this.state,
        wsConnected: true,
        ready: true
      })

      // how is the local queue actually based on this???
      // this cannot be working robustly
      // leave it for re-implementation; not worth trying to sort out now
      this.clearQueue(response.data_package?.workflow.edit_count)
    })
  }

  handleSocketClose(event: CloseEvent) {
    this.has_disconnected = true
    this.has_rendered = true // not sure what this is yet, it's being used in commentbox, likely it needs to go
    console.log('socket disconnected')
  }

  onMessageReceived(e: MessageEvent) {
    // don't feel like this queue system is going to withstand corruption, but leave for now
    if (this.isMessagesQueued) {
      this.messageQueue.push(e)
    } else {
      this.pareAndRouteMessage(e)
    }
  }

  clearQueue(editCount = 0) {
    let startedEdits = false

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift() // Directly remove the first message from the queue

      // Check if we should start processing messages based on edit_count
      if (!startedEdits) {
        if (message.edit_count && parseInt(message.edit_count) >= editCount) {
          startedEdits = true // Start processing subsequent messages after this point
        }
      }

      if (startedEdits) {
        this.pareAndRouteMessage(message) // Process the message if conditions are met
      }
    }

    this.isMessagesQueued = false // All messages processed, set queue status to false
  }

  handleConnectedUsersUpdate(connectedUsers: ConnectedUser[]) {
    this.setState({ connectedUsers })
  }

  /*******************************************************
   * // WEBSOCKET MANAGER
   *******************************************************/

  /*******************************************************
   * WEBSOCKET MESSAGE HANDLERS
   *******************************************************/
  pareAndRouteMessage(e: MessageEvent) {
    const data = JSON.parse(e.data)

    switch (data.type) {
      case DATA_TYPE.WORKFLOW_ACTION:
        this.onWorkflowUpdated(data.action)
        break
      case DATA_TYPE.LOCK_UPDATE:
        this.onLockUpdateReceived(data.action)
        break
      case DATA_TYPE.CONNECTION_UPDATE:
        this.onUserConnectionUpdateReceived(data.action)
        break
      case DATA_TYPE.WORKFLOW_PARENT_UPDATED:
        // this.parent_workflow_updated(data.edit_count) // @todo function takes no args
        this.onParentWorkflowUpdated()
        break
      case DATA_TYPE.WORKFLOW_CHILD_UPDATED:
        this.onChildWorkflowUpdated(data.edit_count, data.child_workflow_id)
        break
      default:
        console.log('socket message not handled')
        break
    }
  }

  onWorkflowUpdated(data) {
    this.store.dispatch(data.action)
  }

  onLockUpdateReceived(data) {
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

    // ...should not need this
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

  onUserConnectionUpdateReceived(data) {}

  // @todo...this is weird...
  childWorkflowDataNeeded(node_id) {
    if (this.child_data_needed.indexOf(node_id) < 0) {
      this.child_data_needed.push(node_id)
      if (!this.fetching_child_data) {
        setTimeout(() => this.getDataForChildWorkflow(), 50) // why another timeout here
      }
    }
  }

  onParentWorkflowUpdated() {
    this.isMessagesQueued = true
    getWorkflowParentDataQuery(this.workflowID, (response) => {
      // remove all the parent node and parent workflow data
      this.store.dispatch(
        ActionCreator.replaceStoreData({
          parent_node: [],
          parent_workflow: []
        })
      )
      this.store.dispatch(ActionCreator.refreshStoreData(response.data_package))
      this.clearQueue(0)
    })
  }

  onChildWorkflowUpdated(edit_count, child_workflow_id) {
    this.isMessagesQueued = true
    const state = this.store.getState()
    const node = state.node.find(
      (node) => node.linked_workflow == child_workflow_id
    )

    if (!node) {
      return
    }

    getWorkflowChildDataQuery(node.id, (response) => {
      this.store.dispatch(ActionCreator.refreshStoreData(response.data_package))
      this.clearQueue()
    })
  }

  /*******************************************************
   * END PARSE MESSAGE LOGIC
   *******************************************************/

  // Fetches the data for the given child workflow
  getDataForChildWorkflow() {
    if (this.child_data_completed === this.child_data_needed.length - 1) {
      this.fetching_child_data = false
      return
    }

    this.fetching_child_data = true
    this.child_data_completed++
    getWorkflowChildDataQuery(
      this.child_data_needed[this.child_data_completed],
      (response) => {
        this.store.dispatch(
          ActionCreator.refreshStoreData(response.data_package)
        )
        setTimeout(() => this.getDataForChildWorkflow(), 50) // why another timeout here
      }
    )
  }

  /*******************************************************
   * Probably each of these belongs somewhere in the editable components
   *
   *  ex see  selection  manager private lockCurrentSelection(): void {
   *  unclear what the responsibility of the selection manager is yet
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

  // Called by the selection manager and during drag events to
  // lock an object, indicating it should not be selectable
  // by any other users
  // this should not live here, it go in the draggable class
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
   * RENDER
   *******************************************************/
  render() {
    this.locks = {}

    // In case we need to get child workflows
    this.child_data_needed = []
    this.child_data_completed = -1
    this.fetching_child_data = false

    if (!this.state.ready) {
      return <Loader />
    }

    return (
      <Provider store={this.store}>
        <WorkFlowConfigProvider initialValue={this}>
          <WorkflowBaseView
            viewType={this.state.viewType}
            parentRender={this.updateView}
            config={{
              canView: this.can_view,
              isStudent: this.is_student,
              projectPermission: this.project_permission,
              alwaysStatic: this.always_static
            }}
          />
        </WorkFlowConfigProvider>
      </Provider>
    )
  }
}

export { Workflow as WorkflowClass } // this is only in here to support the config context, which is itself a stop gap

export default legacyWithRouter(Workflow) // only using HOC until we convert to FC
