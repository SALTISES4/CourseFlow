// @ts-nocheck
import { DATA_TYPE, WebSocketService } from '@cf/HTTP/WebSocketService'
import WebSocketServiceConnectedUserManager from '@cf/HTTP/WebsocketServiceConnectedUserManager'
import ActionCreator from '@cfRedux/ActionCreator'
import {
  getWorkflowByIdQuery,
  getWorkflowChildDataQuery
} from '@XMLHTTP/API/workflow'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'

const useWebSocketManager = (
  workflowId,
  setupData,
  handleConnectedUsersUpdate
) => {
  const [wsConnected, setWsConnected] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState([])
  const dispatch = useDispatch()

  // Refs for managing WebSocket services and state
  const wsServiceRef = useRef(null)
  const wsUserConnectedServiceRef = useRef(null)
  const messageQueueRef = useRef([])
  const isMessagesQueuedRef = useRef(true)
  const locksRef = useRef({})

  // WebSocket connection handlers
  const onConnectionOpened = useCallback(
    (reconnect = false) => {
      setWsConnected(true)
      getWorkflowByIdQuery(workflowId, (response) => {
        dispatch(ActionCreator.refreshStoreData(response.dataPackage))
        clearQueue(response.dataPackage?.workflow.editCount)
      })
    },
    [workflowId, dispatch]
  )

  const handleSocketClose = useCallback(() => {
    setWsConnected(false)
    console.log('socket disconnected')
  }, [])

  const onMessageReceived = useCallback((e) => {
    if (isMessagesQueuedRef.current) {
      messageQueueRef.current.push(e)
    } else {
      pareAndRouteMessage(e)
    }
  }, [])

  // Function to clear queued messages
  const clearQueue = useCallback((editCount = 0) => {
    let startedEdits = false
    while (messageQueueRef.current.length > 0) {
      const message = messageQueueRef.current.shift()
      if (!startedEdits) {
        if (message.editCount && parseInt(message.editCount) >= editCount) {
          startedEdits = true
        }
      }
      if (startedEdits) {
        pareAndRouteMessage(message)
      }
    }
    isMessagesQueuedRef.current = false
  }, [])

  // Define all message handling functions
  const onWorkflowUpdateReceived = useCallback(
    (data) => {
      dispatch(data.action)
    },
    [dispatch]
  )

  const onLockUpdateReceived = useCallback(
    (data) => {
      const { objectType, objectId, lock, userId, userColour, expires } = data

      if (!locksRef.current[objectType]) {
        locksRef.current[objectType] = {}
      }

      if (locksRef.current[objectType][objectId]) {
        clearTimeout(locksRef.current[objectType][objectId])
      }

      dispatch(
        ActionCreator.createLockAction(
          objectId,
          objectType,
          lock,
          userId,
          userColour
        )
      )

      if (lock) {
        locksRef.current[objectType][objectId] = setTimeout(() => {
          dispatch(ActionCreator.createLockAction(objectId, objectType, false))
        }, expires - Date.now())
      } else {
        locksRef.current[objectType][objectId] = null
      }
    },
    [dispatch]
  )

  const onUserConnectionUpdateReceived = useCallback((data) => {
    wsUserConnectedServiceRef.current.connectionUpdateReceived(data)
  }, [])

  const onParentWorkflowUpdateReceived = useCallback(() => {
    isMessagesQueuedRef.current = true
    getWorkflowParentDataQueryLegacy(workflowId, (response) => {
      dispatch(
        ActionCreator.replaceStoreData({ parentNode: [], parentWorkflow: [] })
      )
      dispatch(ActionCreator.refreshStoreData(response.dataPackage))
      clearQueue(0)
    })
  }, [dispatch, workflowId])

  const onChildWorkflowUpdateReceived = useCallback(
    (childWorkflowId) => {
      isMessagesQueuedRef.current = true
      const state = store.getState()
      const node = state.node.find(
        (node) => node.linkedWorkflow === childWorkflowId
      )

      if (!node) return

      getWorkflowChildDataQuery(node.id, (response) => {
        dispatch(ActionCreator.refreshStoreData(response.dataPackage))
        clearQueue()
      })
    },
    [dispatch]
  )

  // Main function to route messages
  const pareAndRouteMessage = useCallback(
    (e) => {
      const data = JSON.parse(e.data)

      switch (data.type) {
        case DATA_TYPE.WORKFLOW_ACTION:
          onWorkflowUpdateReceived(data.action)
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
    [
      onWorkflowUpdateReceived,
      onLockUpdateReceived,
      onUserConnectionUpdateReceived,
      onParentWorkflowUpdateReceived,
      onChildWorkflowUpdateReceived
    ]
  )

  // Initialize WebSocket services
  useEffect(() => {
    const url = `ws/update/${workflowId}/`
    wsServiceRef.current = new WebSocketService(url)
    wsUserConnectedServiceRef.current =
      new WebSocketServiceConnectedUserManager(null, handleConnectedUsersUpdate)
    wsServiceRef.current.connect(
      onMessageReceived,
      onConnectionOpened,
      handleSocketClose
    )

    getWorkflowById(workflowId).then((response) => {
      workflowDetailRespRef.current = response.dataPackage
      setupData(response.dataPackage)
      wsUserConnectedServiceRef.current.startUserUpdates({
        userId: response.dataPackage.userId,
        userName: response.dataPackage.userName
      })
    })

    return () => {
      wsServiceRef.current.disconnect()
    }
  }, [
    workflowId,
    onConnectionOpened,
    handleSocketClose,
    onMessageReceived,
    handleConnectedUsersUpdate,
    setupData
  ])

  return {
    wsConnected,
    connectedUsers
  }
}

export default useWebSocketManager
