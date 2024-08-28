import React from 'react'
import { connect, DispatchProp } from 'react-redux'
import { AnyAction, EmptyObject, Store } from '@reduxjs/toolkit'
import Loader from '@cfCommonComponents/UIComponents/Loader'
import {
  WorkflowDetailViewDTO,
  WorkflowPermission
} from '@cfPages/Workspace/Workflow/types'
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
import { DATA_TYPE, WebSocketService } from '@cfModule/HTTP/WebSocketService'
import legacyWithRouter from '@cfModule/HOC/legacyWithRouter'
import { RouterProps } from 'react-router'
import WebSocketServiceConnectedUserManager, {
  ConnectedUser
} from '@cfModule/HTTP/WebsocketServiceConnectedUserManager'
import { PERMISSION_KEYS } from '@cfConstants'
import { EProject } from '@XMLHTTP/types/entity'
import WorkflowViewLayout from '@cfViews/WorkflowView/WorkflowViewLayout'

const defaultPermissions: WorkflowPermission = {
  readOnly: false,
  viewComments: false,
  addComments: false,
  canView: false
}

type StateProps = {
  connectedUsers: ConnectedUser[]
  wsConnected: boolean
  ready: boolean
  viewType: ViewType
}
type OwnProps = Record<string, never>
type ConnectedProps = Record<string, never>
type PropsType = DispatchProp & OwnProps & ConnectedProps

const calcPermissions = (userPermission: number): WorkflowPermission => {
  switch (userPermission) {
    case PERMISSION_KEYS.VIEW:
      return {
        ...defaultPermissions,
        canView: true
      }
    case PERMISSION_KEYS.COMMENT:
      return {
        ...defaultPermissions,
        viewComments: true,
        addComments: true,
        canView: true
      }

    case PERMISSION_KEYS.EDIT:
      return {
        ...defaultPermissions,
        viewComments: true,
        addComments: true,
        canView: true
      }
  }
  return defaultPermissions
}

/****************************************
 * this is a copy of the original Workflow/Workflow
 * workflow needs to be overhauled, but Comparison/ calls ComparisonView calls, WorkflowComparisonRendererComponent calls WorkflowComparison
 * which extends the original Workflow/Workflow....
 * the hope is that there unpacking this will be less work when Workflow/Workflow is revised first
 * ****************************************/
class Workflow extends React.Component<PropsType & RouterProps, StateProps> {
  private workflowDetailResp: WorkflowDetailViewDTO

  public_view: boolean

  // is_strategy: boolean
  project: EProject
  is_strategy: boolean
  user_id: number
  user_name: string
  project_permission: number

  // def used
  workflowID: number
  private messageQueue: any[]
  private isMessagesQueued: boolean
  selectionManager: SelectionManager
  store: Store<EmptyObject & AppState, AnyAction>
  viewType: ViewType
  protected locks: any
  private wsService: WebSocketService
  workflowPermission: WorkflowPermission

  wsUserConnectedService: WebSocketServiceConnectedUserManager

  // to validate
  private child_data_completed: number
  private child_data_needed: any[]
  private fetching_child_data: boolean

  // to validate removal
  container: any

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
    this.wsService = new WebSocketService(url)

    // Begin connected user manager
    this.wsUserConnectedService = new WebSocketServiceConnectedUserManager(
      this.props.websocket,
      this.handleConnectedUsersUpdate.bind(this)
    )

    this.wsService.connect(
      this.onMessageReceived.bind(this),
      this.onConnectionOpened.bind(this),
      this.handleSocketClose.bind(this)
    )

    // fetch the basic workflow data by id set in URL
    // @todo i think that we have everything we need in getWorkflowDataQuery
    // except for 'choices' config lists TBD
    getWorkflowById(String(this.workflowID)).then((response) => {
      this.workflowDetailResp = response.data_package
      this.setupData(response.data_package)

      // as soon as we have a more stable place to get current user, move this to the beginning of onConnectionOpened
      this.wsUserConnectedService.startUserUpdates({
        userId: response.data_package.user_id,
        userName: response.data_package.user_name
      })
    })
  }

  componentWillUnmount() {
    this.wsService.disconnect()
  }

  setupData(response: WorkflowDetailViewDTO) {
    this.project = response.workflow_data_package.project
    this.is_strategy = response.workflow_data_package.is_strategy

    this.user_id = response.user_id
    this.user_name = response.user_name

    this.public_view = response.public_view

    if (!this.is_strategy && this.project.object_permission) {
      this.project_permission = this.project.object_permission.permission_type
    }

    this.workflowPermission = calcPermissions(response.user_permission)
    this.selectionManager = new SelectionManager(
      this.workflowPermission.readOnly
    )
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
    // begin sending user connected messaged
    this.setState({
      ...this.state,
      wsConnected: true
    })

    // as soon as the socket connection is opened, fetch the 'additional workflow data query'
    // put it in redux store, and indicate that we're ready to render / done loading
    // Q: do we have race condition with main parent 'get workflow data'
    // Q: why are these separate, and how can they be better defined?
    getWorkflowDataQuery(this.workflowID, (response) => {
      // this.unread_comments = response.data_package?.unread_comments // @todo do not assign this explicitly here, not seeing this in data package yet

      // this.store = configureStore({
      //   reducer: Reducers.rootWorkflowReducer,
      //   preloadedState: response.data_package,
      //   devTools: process.env.NODE_ENV !== 'production' // Enable Redux DevTools only in non-production environments
      // })
      this.props.dispatch(ActionCreator.refreshStoreData(response.data_package))

      this.setState({
        ...this.state,
        ready: true
      })

      // how is the local queue actually based on this???
      // this cannot be working robustly
      // leave it for re-implementation; not worth trying to sort out now
      this.clearQueue(response.data_package?.workflow.edit_count)
    })
  }

  handleSocketClose(event: CloseEvent) {
    this.setState({
      ...this.state,
      wsConnected: false
    })
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
          startedEdits = true
        }
      }

      if (startedEdits) {
        this.pareAndRouteMessage(message)
      }
    }

    // All messages processed, set queue status to false
    this.isMessagesQueued = false
  }

  handleConnectedUsersUpdate(connectedUsers: ConnectedUser[]) {
    this.setState({ connectedUsers })
  }

  /*******************************************************
   * // WEBSOCKET MANAGER
   *******************************************************/

  /*******************************************************
   * WEBSOCKET MESSAGE HANDLERS, move these into a hook when ready
   *******************************************************/
  pareAndRouteMessage(e: MessageEvent) {
    const data = JSON.parse(e.data)

    switch (data.type) {
      case DATA_TYPE.WORKFLOW_ACTION:
        this.onWorkflowUpdateReceived(data.action)
        break
      case DATA_TYPE.LOCK_UPDATE:
        this.onLockUpdateReceived(data.action)
        break
      case DATA_TYPE.CONNECTION_UPDATE:
        this.onUserConnectionUpdateReceived(data.action)
        break
      case DATA_TYPE.WORKFLOW_PARENT_UPDATED:
        // this.parent_workflow_updated(data.edit_count) // @todo function takes no args
        this.onParentWorkflowUpdateReceived()
        break
      case DATA_TYPE.WORKFLOW_CHILD_UPDATED:
        this.onChildWorkflowUpdateReceived(data.child_workflow_id)
        break
      default:
        console.log('socket message not handled')
        break
    }
  }

  onWorkflowUpdateReceived(data) {
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

  onUserConnectionUpdateReceived(data) {
    // @todo check the shape of data
    this.wsUserConnectedService.connectionUpdateReceived(data)
  }

  onParentWorkflowUpdateReceived() {

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

  onChildWorkflowUpdateReceived(child_workflow_id) {
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

  /**
   * Fetches the data for the given child workflow
   */
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
    if (this.wsService) {
      this.wsService.send(
        JSON.stringify({
          type: 'micro_update',
          action: obj
        })
      )
    }
  }

  // @todo where used?
  change_field(id, objectType, field, value) {
    const json = {}
    json[field] = value
    this.store.dispatch(ActionCreator.changeField(id, objectType, json))
    updateValueQuery(id, objectType, json, true)
  }

  // Called by the selection manager and during drag events to
  // lock an object, indicating it should not be selectable
  // by any other users
  // this should not live here, it go in the draggable class
  lock_update(obj, time, lock) {
    if (this.wsService) {
      this.wsService.send(
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

  // @todo...this is called in this.context.childWorkflowDataNeeded(
  // needs review
  childWorkflowDataNeeded(nodeId) {
    if (this.child_data_needed.indexOf(nodeId) < 0) {
      this.child_data_needed.push(nodeId)
      if (!this.fetching_child_data) {
        setTimeout(() => this.getDataForChildWorkflow(), 50) // why another timeout here
      }
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
      <WorkFlowConfigProvider
        // some of these could have been direct props to WorkflowBaseView
        // but gor now it makes sense to keep them together and organized
        initialValue={{
          workflowDetailResp: this.workflowDetailResp,
          selectionManager: this.selectionManager,
          viewType: this.state.viewType,
          editableMethods: {
            lock_update: this.lock_update,
            micro_update: this.micro_update,
            change_field: this.change_field
          },
          ws: {
            wsConnected: this.state.wsConnected,
            connectedUsers: this.state.connectedUsers
          },
          permissions: {
            projectPermission: this.project_permission,
            workflowPermission: this.workflowPermission
          }
        }}
      >
        <WorkflowViewLayout
          // viewType={this.state.viewType}
          // alwaysStatic: this.always_static use 'public view' unless the use case gets better defined
          updateView={this.updateView}
        />
      </WorkFlowConfigProvider>
    )
  }
}

export { Workflow as WorkflowClass } // this is only in here to support the config context, which is itself a stop gap
const WorkflowPageUnconnected = legacyWithRouter(Workflow) // only using HOC until we convert to FC

const WorkflowPage = connect<ConnectedProps, DispatchProp, PropsType, AppState>(
  null,
  null
)(WorkflowPageUnconnected)

export default WorkflowPage
