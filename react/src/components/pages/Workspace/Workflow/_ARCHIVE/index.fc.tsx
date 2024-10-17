import { UserContext } from '@cf/context/userContext'
import WorkFlowConfigProvider from '@cf/context/workFlowConfigContext'
import { DATA_TYPE, WebSocketService } from '@cf/HTTP/WebSocketService'
import WebSocketServiceConnectedUserManager, {
  ConnectedUser
} from '@cf/HTTP/WebsocketServiceConnectedUserManager'
import { WorkflowViewType } from '@cf/types/enum'
import Loader from '@cfComponents/UIPrimitives/Loader'
import WorkflowTabs from '@cfPages/Workspace/Workflow/WorkflowTabs'
import ActionCreator from '@cfRedux/ActionCreator'
import { AppState } from '@cfRedux/types/type'
import { SelectionManager } from '@cfRedux/utility/SelectionManager'
import { updateValueQuery } from '@XMLHTTP/API/update'
import {
  getWorkflowByIdQuery,
  getWorkflowChildDataQuery,
  getWorkflowParentDataQueryLegacy
} from '@XMLHTTP/API/workflow'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'

type StateProps = {
  connectedUsers: ConnectedUser[]
  wsConnected: boolean
  ready: boolean
}

type OwnProps = {}
type PropsType = OwnProps

const Workflow: React.FC<PropsType> = () => {
  const { id } = useParams<{ id: string }>()
  const dispatch = useDispatch()
  const userContext = useContext(UserContext)

  const [state, setState] = useState<StateProps>({
    wsConnected: false,
    connectedUsers: [],
    ready: false
  })

  const [messageQueue, setMessageQueue] = useState<any[]>([])
  const [isMessagesQueued, setIsMessagesQueued] = useState<boolean>(true)
  const [selectionManager, setSelectionManager] =
    useState<SelectionManager | null>(null)
  const [wsService, setWsService] = useState<WebSocketService | null>(null)
  const [wsUserConnectedService, setWsUserConnectedService] =
    useState<WebSocketServiceConnectedUserManager | null>(null)
  const [childDataCompleted, setChildDataCompleted] = useState<number>(-1)
  const [childDataNeeded, setChildDataNeeded] = useState<any[]>([])
  const [fetchingChildData, setFetchingChildData] = useState<boolean>(false)
  const locks: Record<string, any> = {}

  useEffect(() => {
    const workflowId = Number(id)

    const wsUrl = `ws/update/${workflowId}/`
    const newWsService = new WebSocketService(wsUrl)
    setWsService(newWsService)

    const newWsUserConnectedService = new WebSocketServiceConnectedUserManager(
      newWsService,
      handleConnectedUsersUpdate
    )
    setWsUserConnectedService(newWsUserConnectedService)

    newWsService.connect(
      onMessageReceived,
      () => onConnectionOpened(workflowId),
      handleSocketClose
    )

    newWsUserConnectedService.startUserUpdates({
      userId: userContext?.id || 0,
      userName: userContext?.name || ''
    })

    return () => {
      newWsService.disconnect()
    }
  }, [id])

  const handleConnectedUsersUpdate = useCallback(
    (connectedUsers: ConnectedUser[]) => {
      setState((prevState) => ({ ...prevState, connectedUsers }))
    },
    []
  )

  const onConnectionOpened = useCallback(
    (workflowId: number) => {
      setState((prevState) => ({ ...prevState, wsConnected: true }))

      getWorkflowByIdQuery(workflowId, (response) => {
        dispatch(ActionCreator.refreshStoreData(response.dataPackage))

        const newSelectionManager = new SelectionManager(
          response.dataPackage.workflow.workflowPermissions.read
        )
        setSelectionManager(newSelectionManager)

        setState((prevState) => ({ ...prevState, ready: true }))
        clearQueue(response.dataPackage.workflow.editCount)
      })
    },
    [dispatch]
  )

  const handleSocketClose = useCallback(() => {
    setState((prevState) => ({ ...prevState, wsConnected: false }))
    console.log('socket disconnected')
  }, [])

  const onMessageReceived = useCallback(
    (e: MessageEvent) => {
      if (isMessagesQueued) {
        setMessageQueue((prevQueue) => [...prevQueue, e])
      } else {
        pareAndRouteMessage(e)
      }
    },
    [isMessagesQueued]
  )

  const clearQueue = useCallback(
    (editCount: number = 0) => {
      let startedEdits = false

      while (messageQueue.length > 0) {
        const message = messageQueue.shift()

        if (!startedEdits) {
          if (
            message &&
            message.editCount &&
            parseInt(message.editCount) >= editCount
          ) {
            startedEdits = true
          }
        }

        if (startedEdits) {
          pareAndRouteMessage(message as MessageEvent)
        }
      }

      setIsMessagesQueued(false)
    },
    [messageQueue]
  )

  const pareAndRouteMessage = useCallback(
    (e: MessageEvent) => {
      const data = JSON.parse(e.data)

      switch (data.type) {
        case DATA_TYPE.WORKFLOW_ACTION:
          dispatch(data.action)
          break
        case DATA_TYPE.LOCK_UPDATE:
          onLockUpdateReceived(data.action)
          break
        case DATA_TYPE.CONNECTION_UPDATE:
          onUserConnectionUpdateReceived(data.action)
          break
        case DATA_TYPE.WORKFLOW_PARENT_UPDATED:
          onParentWorkflowUpdateReceived()
          break
        case DATA_TYPE.WORKFLOW_CHILD_UPDATED:
          onChildWorkflowUpdateReceived(data.childWorkflowId)
          break
        default:
          console.log('socket message not handled')
          break
      }
    },
    [dispatch]
  )

  const onLockUpdateReceived = (data: any) => {
    const { objectType, objectId } = data

    if (!locks[objectType]) {
      locks[objectType] = {}
    }

    if (locks[objectType][objectId]) {
      clearTimeout(locks[objectType][objectId])
    }

    dispatch(
      ActionCreator.createLockAction(
        objectId,
        objectType,
        data.lock,
        data.userId,
        data.userColour
      )
    )

    if (data.lock) {
      locks[objectType][objectId] = setTimeout(() => {
        dispatch(ActionCreator.createLockAction(objectId, objectType, false))
      }, data.expires - Date.now())
    } else {
      locks[objectType][objectId] = null
    }
  }

  const onUserConnectionUpdateReceived = (data: any) => {
    wsUserConnectedService?.connectionUpdateReceived(data)
  }

  const onParentWorkflowUpdateReceived = () => {
    setIsMessagesQueued(true)
    getWorkflowParentDataQueryLegacy(Number(id), (response) => {
      dispatch(
        ActionCreator.replaceStoreData({
          parentNode: [],
          parentWorkflow: []
        })
      )
      dispatch(ActionCreator.refreshStoreData(response.dataPackage))
      clearQueue(0)
    })
  }

  const onChildWorkflowUpdateReceived = (childWorkflowId: number) => {
    setIsMessagesQueued(true)
    getWorkflowChildDataQuery(childWorkflowId, (response) => {
      dispatch(ActionCreator.refreshStoreData(response.dataPackage))
      clearQueue()
    })
  }

  const microUpdate = useCallback(
    (obj: any) => {
      console.log('i am a microupdate')
      if (wsService) {
        wsService.send(
          JSON.stringify({
            type: 'microUpdate',
            action: obj
          })
        )
      }
    },
    [wsService]
  )

  const changeField = useCallback(
    (id: number, objectType: string, field: string, value: any) => {
      const json: Record<string, any> = {}
      json[field] = value
      dispatch(ActionCreator.changeField(id, objectType, json))
      updateValueQuery(id, objectType, json, true)
    },
    [dispatch]
  )

  const lockUpdate = useCallback(
    (obj: any, time: number, lock: boolean) => {
      if (wsService) {
        wsService.send(
          JSON.stringify({
            type: 'lockUpdate',
            lock: {
              ...obj,
              expires: Date.now() + time,
              userId: userContext.id,
              lock
            }
          })
        )
      }
    },
    [wsService, userContext]
  )

  const childWorkflowDataNeeded = useCallback(
    (nodeId: number) => {
      if (!childDataNeeded.includes(nodeId)) {
        setChildDataNeeded((prev) => [...prev, nodeId])
        if (!fetchingChildData) {
          setTimeout(() => getDataForChildWorkflow(), 50)
        }
      }
    },
    [childDataNeeded, fetchingChildData]
  )

  const getDataForChildWorkflow = () => {
    if (childDataCompleted === childDataNeeded.length - 1) {
      setFetchingChildData(false)
      return
    }

    setFetchingChildData(true)
    setChildDataCompleted((prev) => prev + 1)
    getWorkflowChildDataQuery(
      childDataNeeded[childDataCompleted + 1],
      (response) => {
        dispatch(ActionCreator.refreshStoreData(response.dataPackage))
        setTimeout(() => getDataForChildWorkflow(), 50)
      }
    )
  }

  if (!state.ready) {
    return <Loader />
  }

  return (
    <WorkFlowConfigProvider
      initialValue={{
        selectionManager: selectionManager!,
        editableMethods: {
          lockUpdate,
          microUpdate,
          changeField
        },
        ws: {
          wsConnected: state.wsConnected,
          connectedUsers: state.connectedUsers
        }
      }}
    >
      <WorkflowTabs />
    </WorkFlowConfigProvider>
  )
}

export default Workflow
