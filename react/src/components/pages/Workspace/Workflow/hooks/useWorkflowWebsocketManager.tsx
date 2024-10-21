import { DATA_TYPE, WebSocketService } from '@cf/HTTP/WebSocketService'
import WebSocketServiceConnectedUserManager, {
  ConnectedUser
} from '@cf/HTTP/WebsocketServiceConnectedUserManager'
import ActionCreator from '@cfRedux/ActionCreator'
import { updateValueQuery } from '@XMLHTTP/API/update'
import {
  getWorkflowChildDataQuery,
  getWorkflowParentDataQueryLegacy
} from '@XMLHTTP/API/workflow'
import { useGetWorkflowByIdQuery } from '@XMLHTTP/API/workflow.rtk'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

type UseWebSocketManagerProps = {
  userId: number
  userName: string
  workflowId: number
}

export const useWorkflowWebsocketManager = ({
  userId,
  userName,
  workflowId
}: UseWebSocketManagerProps) => {
  const locks: Record<string, any> = {}
  const wsUrl = `ws/update/${workflowId}/`

  const dispatch = useDispatch()

  /*******************************************************
   * STATE
   *******************************************************/
  // ws service
  const [isWsInit, setIsWsInit] = useState(false)
  const [wsService, setWsService] = useState<WebSocketService | null>(null)

  // message queue
  const [isMessagesQueued, setIsMessagesQueued] = useState<boolean>(true)
  const [messageQueue, setMessageQueue] = useState<any[]>([])

  // connected users
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([])
  const [wsUserConnectedService, setWsUserConnectedService] =
    useState<WebSocketServiceConnectedUserManager | null>(null)

  /*******************************************************
   * QUERIES
   *******************************************************/
  const { data } = useGetWorkflowByIdQuery({ id: workflowId })

  /*******************************************************
   * LIFE CYCLE
   *******************************************************/
  useEffect(() => {
    const newWsService = new WebSocketService(wsUrl)

    const newWsUserConnectedService = new WebSocketServiceConnectedUserManager(
      newWsService,
      handleConnectedUsersUpdate
    )

    newWsService.connect(
      onMessageReceived,
      () => onConnectionOpened(),
      onSocketClose
    )

    newWsUserConnectedService.startUserUpdates({
      userId,
      userName
    })

    setWsService(newWsService)
    setWsUserConnectedService(newWsUserConnectedService)

    return () => {
      newWsService.disconnect()
    }
  }, [workflowId, userId, userName])

  useEffect(() => {
    if (data) {
      dispatch(ActionCreator.refreshStoreData(data.dataPackage))
      setIsMessagesQueued(false)
    }
  }, [data])

  useEffect(() => {
    if (data) {
      dispatch(ActionCreator.refreshStoreData(data.dataPackage))
      setIsMessagesQueued(false)
    }
  }, [data])

  /*******************************************************
   * HANDLERS
   *******************************************************/
  /**
   *
   */
  const onConnectionOpened = useCallback(() => {
    setIsWsInit(true)
  }, [])

  /**
   *
   */
  const onSocketClose = useCallback(() => {
    setIsWsInit(false)
  }, [])

  /**
   *
   */
  const onMessageReceived = useCallback(
    (e: MessageEvent) => {
      if (isMessagesQueued) {
        setMessageQueue((prevQueue) => [...prevQueue, e])
      } else {
        parseAndRouteMessage(e)
      }
    },
    [isMessagesQueued]
  )

  /**
   *
   */
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

  /**
   *
   */
  const onUserConnectionUpdateReceived = (data: any) => {
    wsUserConnectedService?.connectionUpdateReceived(data)
  }

  /**
   *
   */
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

  /**
   *
   */
  const onChildWorkflowUpdateReceived = (childWorkflowId: number) => {
    setIsMessagesQueued(true)
    getWorkflowChildDataQuery(childWorkflowId, (response) => {
      dispatch(ActionCreator.refreshStoreData(response.dataPackage))
      clearQueue()
    })
  }

  /*******************************************************
   *
   *******************************************************/
  const handleConnectedUsersUpdate = useCallback(
    (connectedUsers: ConnectedUser[]) => {
      setConnectedUsers(connectedUsers)
    },
    []
  )

  /**
   *
   */
  const clearQueue = useCallback(
    (editCount: number = 0) => {
      let startedEdits = false

      while (messageQueue.length > 0) {
        const message = messageQueue.shift()
        if (
          !startedEdits &&
          message &&
          message.editCount &&
          parseInt(message.editCount) >= editCount
        ) {
          startedEdits = true
        }

        if (startedEdits) {
          parseAndRouteMessage(message as MessageEvent)
        }
      }

      setIsMessagesQueued(false)
    },
    [messageQueue]
  )

  /**
   *
   */
  const parseAndRouteMessage = useCallback(
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

  return {
    isWsInit,
    connectedUsers,
    messageQueue,
    clearQueue,
    onLockUpdateReceived,
    microUpdate: useCallback(
      (obj: any) => {
        if (wsService) {
          wsService.send(JSON.stringify({ type: 'microUpdate', action: obj }))
        }
      },
      [wsService]
    ),
    changeField: useCallback(
      (id: number, objectType: string, field: string, value: any) => {
        const json: Record<string, any> = { [field]: value }
        dispatch(ActionCreator.changeField(id, objectType, json))
        updateValueQuery(id, objectType, json, true)
      },
      [dispatch]
    ),
    lockUpdate: useCallback(
      (obj: any, time: number, lock: boolean) => {
        if (wsService) {
          wsService.send(
            JSON.stringify({
              type: 'lockUpdate',
              lock: { ...obj, expires: Date.now() + time, userId, lock }
            })
          )
        }
      },
      [wsService, userId]
    )
  }
}
