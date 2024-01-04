class WebSocketManager {
  constructor(workflowID, handleMessage, handleOpen, handleClose) {
    this.workflowID = workflowID
    this.handleMessage = handleMessage
    this.handleOpen = handleOpen
    this.handleClose = handleClose
    this.updateSocket = null
    this.message_queue = []
    this.messages_queued = true
  }

  connect() {
    const websocket_prefix =
      window.location.protocol === 'https:' ? 'wss' : 'ws'
    this.updateSocket = new WebSocket(
      `${websocket_prefix}://${window.location.host}/ws/update/${this.workflowID}/`
    )

    this.updateSocket.onmessage = (e) => {
      if (this.messages_queued) {
        this.message_queue.push(e)
      } else {
        this.handleMessage(e)
      }
    }

    this.updateSocket.onopen = () => {
      this.handleOpen()
      this.messages_queued = false
      this.processQueue()
    }

    this.updateSocket.onclose = (e) => {
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
    if (this.updateSocket && this.updateSocket.readyState === WebSocket.OPEN) {
      this.updateSocket.send(JSON.stringify(message))
    }
  }

  // Additional WebSocket logic as needed...
}

export default WebSocketManager
