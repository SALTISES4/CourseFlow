class WebSocketManager {
  constructor(workflowID, handleMessage, handleOpen, handleClose) {
    this.workflowID = workflowID
    this.handleMessage = handleMessage
    this.handleOpen = handleOpen
    this.handleClose = handleClose
    this.websocket = null
    this.message_queue = []
    this.messages_queued = true
  }

  connect() {
    const websocket_prefix =
      window.location.protocol === 'https:' ? 'wss' : 'ws'
    this.websocket = new WebSocket(
      `${websocket_prefix}://${window.location.host}/ws/update/${this.workflowID}/`
    )

    this.websocket.onmessage = (e) => {
      if (this.messages_queued) {
        this.message_queue.push(e)
      } else {
        this.handleMessage(e)
      }
    }

    this.websocket.onopen = () => {
      this.handleOpen()
      this.messages_queued = false
      this.processQueue()
    }

    this.websocket.onclose = (e) => {
      this.handleClose(e)
      this.messages_queued = true
    }
  }

  processQueue() {
    while (this.message_queue.length > 0) {
      const message = this.message_queue.shift()
      this.handleMessage(message)
    }
  }

  sendMessage(message) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message))
    }
  }

  // Additional WebSocket logic as needed...
}

export default WebSocketManager
