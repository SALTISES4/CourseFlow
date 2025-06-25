import { WS_EVENT_TYPE, WebSocketService } from '@cf/HTTP/WebSocketService'
import WebSocketServiceConnectedUserManager, {
  ConnectedUser
} from '@cf/HTTP/WebsocketServiceConnectedUserManager'
import { EUser } from '@cf/HTTP/XMLHTTP/types/entity'
import { CfLock } from '@cf/types/common'
import { CfObjectType } from '@cf/types/enum'
import Utility from '@cf/utility/Utility.class'
import ActionCreator from '@cfRedux/ActionCreator'
import { updateValueQuery } from '@XMLHTTP/API/update'
import {
  getWorkflowChildDataQuery,
  getWorkflowParentDataQueryLegacy
} from '@XMLHTTP/API/workflowObjects/workflow'
import { useGetWorkflowByIdQuery } from '@XMLHTTP/API/workflowObjects/workflow.rtk'
import { produce } from 'immer'
import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

type UseWebSocketManagerProps = {
  user: EUser
  workflowId: number
}

type StateType = {
  socketInit: boolean
  socketService: WebSocketService | null
  messagesQueued: boolean
  messageQueue: any[]
  // connectedUsers: ConnectedUser[]
  connectedUsersService: WebSocketServiceConnectedUserManager | null
}

export const useWorkflowWebsocketManager = ({
  user,
  workflowId
}: UseWebSocketManagerProps) => {
  // TODO: review locks, this does essentially nothing
  const locks: Record<string, any> = {}
  const wsUrl = `ws/update/${workflowId}/`

  const dispatch = useDispatch()

  const [state, setState] = useState<StateType>({
    socketInit: false,
    socketService: null,

    // TODO: queue mgmt is not working, disable for now (init state = false)
    messagesQueued: false,
    messageQueue: [],

    // connectedUsers: [],
    connectedUsersService: null
  })

  // TODO: move to state above, identify why its 'readonly' when
  // WebSocketServiceConnectedUserManager modifies internal properties (?)
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([])

  /*******************************************************
   * QUERIES
   *******************************************************/
  const { data } = useGetWorkflowByIdQuery({ id: workflowId })

  /*******************************************************
   * LIFE CYCLE
   *******************************************************/
  const onLockUpdateReceived = useCallback(
    ({
      objectType,
      objectId,
      lock,
      userId,
      userColour,
      expires
    }: {
      objectType: CfObjectType
      objectId: number
      lock: boolean
      userId: number
      userColour: string
      expires: number
    }) => {
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
          lock,
          userId,
          userColour
        )
      )

      if (lock) {
        locks[objectType][objectId] = setTimeout(() => {
          dispatch(ActionCreator.createLockAction(objectId, objectType, false))
        }, expires - Date.now())
      } else {
        locks[objectType][objectId] = null
      }
    },
    [dispatch, locks]
  )

  const onUserConnectionUpdateReceived = useCallback(
    (data: ConnectedUser) => {
      state.connectedUsersService?.connectionUpdateReceived(data)
    },
    [state.connectedUsersService]
  )

  const parseAndRouteMessage = useCallback(
    (e: MessageEvent) => {
      const data = JSON.parse(e.data)

      // @todo need to insert type guards here
      // Utility.logger(data)

      // here we will insert the publisher filter logic
      // it might not stay here
      if (
        'publishingUserId' in data &&
        data.user.id === data.publishingUserId
      ) {
        // drop message
        return
      }

      switch (data.type) {
        case WS_EVENT_TYPE.WORKFLOW_ACTION:
          // TODO: break this down
          dispatch(data.action)
          break
        case WS_EVENT_TYPE.LOCK_UPDATE:
          onLockUpdateReceived(data.action)
          break
        case WS_EVENT_TYPE.CONNECTION_UPDATE:
          onUserConnectionUpdateReceived(data.action)
          break
        case WS_EVENT_TYPE.WORKFLOW_PARENT_UPDATED:
          // onParentWorkflowUpdateReceived()
          break
        case WS_EVENT_TYPE.WORKFLOW_CHILD_UPDATED:
          // onChildWorkflowUpdateReceived(data.childWorkflowId)
          break
        default:
          Utility.logger('socket message not handled')
          break
      }
    },
    [dispatch, onLockUpdateReceived, onUserConnectionUpdateReceived]
  )

  const onConnectionOpened = useCallback(() => {
    setState(
      produce((draft) => {
        draft.socketInit = true
      })
    )
  }, [])

  const onSocketClose = useCallback(() => {
    setState(
      produce((draft) => {
        draft.socketInit = false
      })
    )
  }, [])

  const onMessageReceived = useCallback(
    (e: MessageEvent) => {
      if (state.messagesQueued) {
        setState(
          produce((draft) => {
            draft.messageQueue.push(e)
          })
        )
      } else {
        parseAndRouteMessage(e)
      }
    },
    [parseAndRouteMessage, state.messagesQueued]
  )

  const handleConnectedUsersUpdate = useCallback(
    (connectedUsers: ConnectedUser[]) => {
      // setState(
      //   produce((draft) => {
      //     draft.connectedUsers = connectedUsers
      //   })
      // )
      setConnectedUsers(connectedUsers)
    },
    []
  )

  const clearQueue = useCallback(
    (editCount: number = 0) => {
      let startedEdits = false

      while (state.messageQueue.length > 0) {
        const message = state.messageQueue[0]
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

      setState(
        produce((draft) => {
          draft.messageQueue.shift() // first message in queue handled above
          draft.messagesQueued = false
        })
      )
    },
    [parseAndRouteMessage, state.messageQueue]
  )

  // const onParentWorkflowUpdateReceived = useCallback(() => {
  //   setState(
  //     produce((draft) => {
  //       draft.messagesQueued = true
  //     })
  //   )
  //   getWorkflowParentDataQueryLegacy(Number(id), (response) => {
  //     dispatch(
  //       ActionCreator.replaceStoreData({
  //         parentNode: [],
  //         parentWorkflow: []
  //       })
  //     )
  //     dispatch(ActionCreator.refreshStoreData(response.dataPackage))
  //     clearQueue(0)
  //   })
  // }, [clearQueue, dispatch])

  // const onChildWorkflowUpdateReceived = useCallback(
  //   (childWorkflowId: number) => {
  //     setState(
  //       produce((draft) => {
  //         draft.messagesQueued = true
  //       })
  //     )
  //     getWorkflowChildDataQuery(childWorkflowId, (response) => {
  //       dispatch(ActionCreator.refreshStoreData(response.dataPackage))
  //       clearQueue()
  //     })
  //   },
  //   [clearQueue, dispatch]
  // )

  /*******************************************************
   * Instantiates the WS manager as well as the user update manager
   * some issue with managing dependencies between the two
   * possibly there is a circ dependency which needs to be unpacked
   *******************************************************/
  useEffect(() => {
    const service = new WebSocketService(wsUrl)

    const newWsUserConnectedService = new WebSocketServiceConnectedUserManager(
      service,
      user,
      handleConnectedUsersUpdate
    )

    // fire internally on init?
    newWsUserConnectedService.startUserUpdates()

    setState(
      produce((draft) => {
        draft.socketService = service
        draft.connectedUsersService = newWsUserConnectedService
      })
    )

    return () => {
      service.disconnect()
      newWsUserConnectedService.stopUserUpdates()
    }
  }, [workflowId, user, wsUrl, handleConnectedUsersUpdate])

  /*******************************************************
   * caution: the order in which instantiation is managed by loading into state
   * is a bit fragile
   * hence the dep on wsService, wsUserConnectedService
   * this is not optimized
   *******************************************************/
  useEffect(() => {
    if (!state.socketService || !state.connectedUsersService) {
      return
    }

    state.socketService.connect(
      onMessageReceived,
      onConnectionOpened,
      onSocketClose
    )
  }, [
    state.socketService,
    state.connectedUsersService,
    onMessageReceived,
    onConnectionOpened,
    onSocketClose
  ])

  useEffect(() => {
    if (data) {
      dispatch(ActionCreator.refreshStoreData(data.dataPackage))
      setState(
        produce((draft) => {
          draft.messagesQueued = false
        })
      )
    }
  }, [data, dispatch])

  return {
    isWsInit: state.socketInit,
    connectedUsers: connectedUsers,
    messageQueue: state.messageQueue,
    clearQueue,
    onLockUpdateReceived,
    microUpdate: useCallback(
      (obj: any) => {
        const payload: { type: WS_EVENT_TYPE; action: any } = {
          type: WS_EVENT_TYPE.MICRO_UPDATE,
          action: obj
        }
        if (state.socketService) {
          state.socketService.send(JSON.stringify(payload))
        }
      },
      [state.socketService]
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
    // lock update is for transmitting the WS message
    lockUpdate: useCallback(
      (
        obj: { objectId: number; objectType: CfObjectType },
        time: number,
        lock: boolean
      ) => {
        const payload: { type: WS_EVENT_TYPE; lock: CfLock } = {
          type: WS_EVENT_TYPE.LOCK_UPDATE,
          lock: {
            ...obj,
            expires: Date.now() + time,
            userId: user.id,
            lock
          }
        }

        if (state.socketService) {
          state.socketService.send(JSON.stringify(payload))
        }
      },
      [state.socketService, user.id]
    )
  }
}
