// @ts-nocheck
import WorkFlowConfigProvider from '@cf/context/workFlowConfigContext'
import legacyWithRouter from '@cf/HOC/legacyWithRouter'
import { DATA_TYPE, WebSocketService } from '@cf/HTTP/WebSocketService'
import WebSocketServiceConnectedUserManager, {
  ConnectedUser
} from '@cf/HTTP/WebsocketServiceConnectedUserManager'
import { WorkflowViewType } from '@cf/types/enum'
import { calcWorkflowPermissions } from '@cf/utility/permissions'
import Loader from '@cfComponents/UIPrimitives/Loader'
import { WorkflowPermission } from '@cfPages/Workspace/Workflow/types'
import WorkflowTabs from '@cfPages/Workspace/Workflow/WorkflowTabs'
import ActionCreator from '@cfRedux/ActionCreator'
import { AppState } from '@cfRedux/types/type'
import { SelectionManager } from '@cfRedux/utility/SelectionManager'
import { AnyAction, EmptyObject, Store } from '@reduxjs/toolkit'
import { updateValueQuery } from '@XMLHTTP/API/update'
import {
  getWorkflowById,
  getWorkflowChildDataQuery,
  getWorkflowQuery,
  getWorkflowParentDataQueryLegacy
} from '@XMLHTTP/API/workflow'
import { WorkflowDetailViewDTO } from '@XMLHTTP/types/dto'
import { EProject } from '@XMLHTTP/types/entity'
import React from 'react'
import { DispatchProp, connect } from 'react-redux'
import { RouterProps } from 'react-router'

type StateProps = {
  connectedUsers: ConnectedUser[]
  wsConnected: boolean
  ready: boolean
}
type OwnProps = NonNullable<unknown>
type ConnectedProps = Record<string, never>
type PropsType = DispatchProp & OwnProps & ConnectedProps

/****************************************
 * this is a copy of the original Workflow/Workflow
 * workflow needs to be overhauled, but Comparison/ calls ComparisonView calls, WorkflowComparisonRendererComponent calls WorkflowComparison
 * which extends the original Workflow/Workflow....
 * the hope is that there unpacking this will be less work when Workflow/Workflow is revised first
 * ****************************************/
class Workflow extends React.Component<PropsType & RouterProps, StateProps> {
  private workflowDetailResp: WorkflowDetailViewDTO

  publicView: boolean

  // isStrategy: boolean
  project: EProject
  isStrategy: boolean
  userId: number
  userName: string
  projectPermission: number

  // def used
  workflowId: number
  private messageQueue: any[]
  private isMessagesQueued: boolean
  selectionManager: SelectionManager
  store: Store<EmptyObject & AppState, AnyAction>
  viewType: WorkflowViewType
  protected locks: any
  private wsService: WebSocketService
  workflowPermission: WorkflowPermission

  wsUserConnectedService: WebSocketServiceConnectedUserManager

  // to validate
  private childDataCompleted: number
  private childDataNeeded: any[]
  private fetchingChildData: boolean

  // to validate removal
  container: any

  constructor(props: PropsType & RouterProps) {
    super(props)

    this.state = {
      wsConnected: false,
      connectedUsers: [],
      ready: false
    }

    this.isMessagesQueued = true // why would this be true right away?
    this.messageQueue = []
  }

  componentDidMount() {
    const { id } = this.props.params
    this.workflowId = id

    // Begin websocket connection manager
    const url = `ws/update/${this.workflowId}/`
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
    getWorkflowById(this.workflowId).then((response) => {
      this.workflowDetailResp = response.dataPackage
      this.setupData(response.dataPackage)

      // as soon as we have a more stable place to get current user, move this to the beginning of onConnectionOpened
      this.wsUserConnectedService.startUserUpdates({
        userId: response.dataPackage.userId,
        userName: response.dataPackage.userName
      })
    })
  }

  componentWillUnmount() {
    this.wsService.disconnect()
  }

  setupData(response: WorkflowDetailViewDTO) {
    this.project = response.workflowDataPackage.project
    this.isStrategy = response.workflowDataPackage.isStrategy

    this.userId = response.userId
    this.userName = response.userName

    this.publicView = response.publicView

    if (!this.isStrategy && this.project.objectPermission) {
      this.projectPermission = this.project.objectPermission.permissionType
    }

    this.workflowPermission = calcWorkflowPermissions(response.userPermission)
    this.selectionManager = new SelectionManager(
      this.workflowPermission.readOnly
    )
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
    getWorkflowQuery(this.workflowId, (response) => {
      // this.unreadComments = response.dataPackage?.unreadComments // @todo do not assign this explicitly here, not seeing this in data package yet

      this.props.dispatch(ActionCreator.refreshStoreData(response.dataPackage))

      this.setState({
        ...this.state,
        ready: true
      })

      // how is the local queue actually based on this???
      // this cannot be working robustly
      // leave it for re-implementation; not worth trying to sort out now
      this.clearQueue(response.dataPackage?.workflow.editCount)
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

      // Check if we should start processing messages based on editCount
      if (!startedEdits) {
        if (message.editCount && parseInt(message.editCount) >= editCount) {
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
        // this.parentWorkflow_updated(data.editCount) // @todo function takes no args
        this.onParentWorkflowUpdateReceived()
        break
      case DATA_TYPE.WORKFLOW_CHILD_UPDATED:
        this.onChildWorkflowUpdateReceived(data.childWorkflowId)
        break
      default:
        console.log('socket message not handled')
        break
    }
  }

  onWorkflowUpdateReceived(data) {
    this.props.dispatch(data.action)
  }

  onLockUpdateReceived(data) {
    const objectType = data.objectType
    const objectId = data.objectId

    if (!this.locks[objectType]) {
      this.locks[objectType] = {}
    }

    if (this.locks[objectType][objectId]) {
      clearTimeout(this.locks[objectType][objectId])
    }

    this.props.dispatch(
      ActionCreator.createLockAction(
        objectId,
        objectType,
        data.lock,
        data.userId,
        data.userColour
      )
    )

    // ...should not need this
    if (data.lock) {
      this.locks[objectType][objectId] = setTimeout(() => {
        this.store.dispatch(
          ActionCreator.createLockAction(objectId, objectType, false)
        )
      }, data.expires - Date.now())
    } else {
      this.locks[objectType][objectId] = null
    }
  }

  onUserConnectionUpdateReceived(data) {
    // @todo check the shape of data
    this.wsUserConnectedService.connectionUpdateReceived(data)
  }

  onParentWorkflowUpdateReceived() {
    this.isMessagesQueued = true
    getWorkflowParentDataQueryLegacy(this.workflowId, (response) => {
      // remove all the parent node and parent workflow data
      this.store.dispatch(
        ActionCreator.replaceStoreData({
          parentNode: [],
          parentWorkflow: []
        })
      )
      this.store.dispatch(ActionCreator.refreshStoreData(response.dataPackage))
      this.clearQueue(0)
    })
  }

  onChildWorkflowUpdateReceived(childWorkflowId) {
    this.isMessagesQueued = true
    const state = this.store.getState()
    const node = state.node.find(
      (node) => node.linkedWorkflow == childWorkflowId
    )

    if (!node) {
      return
    }

    getWorkflowChildDataQuery(node.id, (response) => {
      this.store.dispatch(ActionCreator.refreshStoreData(response.dataPackage))
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
    if (this.childDataCompleted === this.childDataNeeded.length - 1) {
      this.fetchingChildData = false
      return
    }

    this.fetchingChildData = true
    this.childDataCompleted++
    getWorkflowChildDataQuery(
      this.childDataNeeded[this.childDataCompleted],
      (response) => {
        this.store.dispatch(
          ActionCreator.refreshStoreData(response.dataPackage)
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
  microUpdate(obj) {
    if (this.wsService) {
      this.wsService.send(
        JSON.stringify({
          type: 'microUpdate',
          action: obj
        })
      )
    }
  }

  // @todo where used?
  changeField(id, objectType, field, value) {
    const json = {}
    json[field] = value
    this.store.dispatch(ActionCreator.changeField(id, objectType, json))
    updateValueQuery(id, objectType, json, true)
  }

  // Called by the selection manager and during drag events to
  // lock an object, indicating it should not be selectable
  // by any other users
  // this should not live here, it go in the draggable class
  lockUpdate(obj, time, lock) {
    if (this.wsService) {
      this.wsService.send(
        JSON.stringify({
          type: 'lockUpdate',
          lock: {
            ...obj,
            expires: Date.now() + time,
            userId: this.userId,
            //  userColour: COURSEFLOW_APP.contextData.myColour,
            lock: lock
          }
        })
      )
    }
  }

  // @todo...this is called in this.context.childWorkflowDataNeeded(
  // needs review
  childWorkflowDataNeeded(nodeId) {
    if (this.childDataNeeded.indexOf(nodeId) < 0) {
      this.childDataNeeded.push(nodeId)
      if (!this.fetchingChildData) {
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
    this.childDataNeeded = []
    this.childDataCompleted = -1
    this.fetchingChildData = false

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
          editableMethods: {
            lockUpdate: this.lockUpdate,
            microUpdate: this.microUpdate,
            changeField: this.changeField
          },
          ws: {
            wsConnected: this.state.wsConnected,
            connectedUsers: this.state.connectedUsers
          },
          permissions: {
            projectPermission: this.projectPermission,
            workflowPermission: this.workflowPermission
          }
        }}
      >
        <WorkflowTabs />
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
