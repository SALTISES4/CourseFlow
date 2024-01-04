class WebSocketManager {
  constructor(
    workflowID,
    onMessageReceived,
    onConnectionOpened,
    onConnectionClosed
  ) {
    this.workflowID = workflowID
    this.onMessageReceived = onMessageReceived
    this.onConnectionOpened = onConnectionOpened
    this.onConnectionClosed = onConnectionClosed
    this.message_queue = []
    this.messages_queued = true
    this.has_disconnected = false
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
        this.onMessageReceived(e)
      }
    }

    this.updateSocket.onopen = () => {
      this.onConnectionOpened()
      this.has_rendered = true
    }

    this.updateSocket.onclose = (e) => this.handleSocketClose(e)
  }

  handleSocketClose(e) {
    if (e.code === 1000) return
    this.onConnectionClosed()
    this.is_static = true
    this.has_disconnected = true
    this.attempt_reconnect()
  }

  attempt_reconnect() {
    setTimeout(() => this.connect(), 30000)
  }

  clear_queue(edit_count) {
    // Logic to clear the message queue
  }

  sendMessage(message) {
    if (this.updateSocket.readyState === WebSocket.OPEN) {
      this.updateSocket.send(JSON.stringify(message))
    }
  }
}

export default WebSocketManager
