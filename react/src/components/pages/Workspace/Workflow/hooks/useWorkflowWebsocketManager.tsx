import { WS_EVENT_TYPE, WebSocketService } from '@cf/HTTP/WebSocketService'
import WebSocketServiceConnectedUserManager, {
  ConnectedUser
} from '@cf/HTTP/WebsocketServiceConnectedUserManager'
import { EUser } from '@cf/HTTP/XMLHTTP/types/entity'
import { CfLock } from '@cf/types/common'
import { CfObjectType } from '@cf/types/enum'
import Utility from "@cf/utility/Utility.class";
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
  user: EUser
  workflowId: number
}

export const useWorkflowWebsocketManager = ({
  user,
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
  // @todo queue mgmt is not working, disable for now (init state = false)
  const [isMessagesQueued, setIsMessagesQueued] = useState<boolean>(false)
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

  /*******************************************************
   * Instantiates the WS manager as well as the user update manager
   * some issue with managing dependencies between the two
   * possibly there is a circ dependency which needs to be unpacked
   *******************************************************/
  useEffect(() => {
    const newWsService = new WebSocketService(wsUrl)
    setWsService(newWsService)

    const newWsUserConnectedService = new WebSocketServiceConnectedUserManager(
      newWsService,
      handleConnectedUsersUpdate
    )
    newWsUserConnectedService.startUserUpdates(user)
    setWsUserConnectedService(newWsUserConnectedService)

    return () => {
      newWsService.disconnect()
      newWsUserConnectedService.stopUserUpdates()
    }
  }, [workflowId, user])

  /*******************************************************
   * caution: the order in which instantiation is managed by loading into state
   * is a bit fragile
   * hence the dep on wsService, wsUserConnectedService
   * this is not optimized
   *******************************************************/
  useEffect(() => {
    if (!wsService || !wsUserConnectedService) {
      return
    }

    wsService.connect(
      onMessageReceived,
      () => onConnectionOpened(),
      onSocketClose
    )
  }, [wsService, wsUserConnectedService])

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
  const onMessageReceived = (e: MessageEvent) => {
    if (isMessagesQueued) {
      setMessageQueue((prevQueue) => [...prevQueue, e])
    } else {
      parseAndRouteMessage(e)
    }
  }

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

  const parseAndRouteMessage = (e: MessageEvent) => {
    const data = JSON.parse(e.data)

    // @todo need to insert type guards here

    Utility.logger(data)

    // here we will insert the publisher filter logic
    // it might not stay here
    if (
      data.hasOwnProperty('publishingUserId') &&
      data.user.id === data?.publishingUserId
    ) {
      // drop message
      return
    }

    switch (data.type) {
      case WS_EVENT_TYPE.WORKFLOW_ACTION:
        dispatch(data.action)
        break
      case WS_EVENT_TYPE.LOCK_UPDATE:
        onLockUpdateReceived(data.action)
        break
      case WS_EVENT_TYPE.CONNECTION_UPDATE:
        onUserConnectionUpdateReceived(data.action)
        break
      case WS_EVENT_TYPE.WORKFLOW_PARENT_UPDATED:
        onParentWorkflowUpdateReceived()
        break
      case WS_EVENT_TYPE.WORKFLOW_CHILD_UPDATED:
        onChildWorkflowUpdateReceived(data.childWorkflowId)
        break
      default:
        Utility.logger('socket message not handled')
        break
    }
  }

  return {
    isWsInit,
    connectedUsers,
    messageQueue,
    clearQueue,
    onLockUpdateReceived,
    microUpdate: useCallback(
      (obj: any) => {
        const payload: { type: WS_EVENT_TYPE; action: any } = {
          type: WS_EVENT_TYPE.MICRO_UPDATE,
          action: obj
        }
        if (wsService) {
          wsService.send(JSON.stringify(payload))
        }
      },
      [wsService]
    ),
    changeField: useCallback(
      (id: number, objectType: CfObjectType, field: string, value: any) => {
        const json: Record<string, any> = { [field]: value }

        // dispatch value to redux and then perform REST query
        // this is therefore an optimistic update, but we are not performing
        dispatch(ActionCreator.changeField(id, objectType, json))
        updateValueQuery(id, objectType, json, true)
      },
      [dispatch]
    ),
    lockUpdate: useCallback(
      (obj: any, time: number, lock: boolean) => {
        const payload: { type: WS_EVENT_TYPE; lock: CfLock } = {
          type: WS_EVENT_TYPE.LOCK_UPDATE,
          lock: { ...obj, expires: Date.now() + time, user, lock }
        }

        if (wsService) {
          wsService.send(JSON.stringify(payload))
        }
      },
      [wsService, user]
    )
  }
}
