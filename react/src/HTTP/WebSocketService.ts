/**
 * 0 - CONNECTING: The connection is not yet open.
 * 1 - OPEN: The connection is open and ready to communicate.
 * 2 - CLOSING: The connection is in the process of closing.
 * 3 - CLOSED: The connection is closed or couldn't be opened.
 */

export enum DATA_TYPE {
  WORKFLOW_ACTION = 'workflow_action',
  LOCK_UPDATE = 'lock_update',
  CONNECTION_UPDATE = 'connection_update',
  WORKFLOW_PARENT_UPDATED = 'workflow_parent_updated',
  WORKFLOW_CHILD_UPDATED = 'workflow_child_updated'
}

type MessageHandler = (event: MessageEvent) => void
type OpenHandler = () => void
type CloseHandler = (event: CloseEvent) => void
const websocketHost = window.location.host
const websocketPrefix = window.location.protocol === 'https:' ? 'wss' : 'ws'

export class WebSocketService {
  private websocket: WebSocket
  private messageQueue: MessageEvent[]
  private messagesQueued: boolean
  private reconnectInterval = 1000 // Initial reconnect interval in milliseconds
  private maxReconnectAttempts = 10 // Maximum number of reconnect attempts
  private maxReconnectInterval = 30000 // Maximum interval in milliseconds
  private reconnectAttempts = 0
  private reconnect: () => void

  constructor(url: string) {
    this.websocket = new WebSocket(
      `${websocketPrefix}://${websocketHost}/${url}`
    )
    this.messageQueue = []
    this.messagesQueued = true
  }

  connect(
    onMessage: MessageHandler,
    onOpen: OpenHandler,
    onClose: CloseHandler
  ): void {
    this.reconnect = () => this.connect(onMessage, onOpen, onClose)

    this.websocket.onmessage = (event: MessageEvent) => {
      if (this.messagesQueued) {
        this.messageQueue.push(event)
      } else {
        onMessage(event)
      }
    }

    this.websocket.onopen = () => {
      this.messagesQueued = false
      onOpen()
    }

    this.websocket.onclose = (event: CloseEvent) => {
      this.messagesQueued = true
      this.handleSocketClose(event)

      // execute additional handler if passed in
      onClose(event)
    }
  }

  sendMessage(message: any): void {
    if (this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message))
    }
  }

  calculateReconnectInterval(): number {
    const interval =
      Math.pow(2, this.reconnectAttempts) * this.reconnectInterval
    return Math.min(interval, this.maxReconnectInterval)
  }

  disconnect(): void {
    try {
      this.websocket.close(1000) // Close with normal closure code
    } catch (e) {
      console.log('tried to call close on a non-existent socket ')
      console.log(e)
    }
  }

  handleSocketClose(event: CloseEvent) {
    if (event.code === 1000) {
      console.log('WebSocket closed normally.')
    } else {
      this.reconnectAttempts++
      if (this.reconnectAttempts <= this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnect()
        }, this.calculateReconnectInterval())
      } else {
        console.error('Maximum reconnect attempts reached.')
        console.error(
          window.gettext(
            'Unable to establish connection to the server, or connection has been lost.'
          )
        )
      }
    }
  }

  clearMessageQueue(processMessage: (message: MessageEvent) => void): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message) {
        processMessage(message)
      }
    }
  }

  /**
   * thin wrappers so we don't expose the underlying websocket object to other components
   * perhaps not needed if we re-implement as singleton
   */
  getState() {
    return this.websocket.readyState
  }

  send(jsonString: string) {
    this.websocket.send(jsonString)
  }
}
