class WebSocketServiceGlobal {
  static instance = null
  private url: any
  private messageHandlers: any[]
  private openHandlers: any[]
  private closeHandlers: any[]
  private websocket: WebSocket

  constructor(url) {
    this.url = url
    this.messageHandlers = []
    this.openHandlers = []
    this.closeHandlers = []
  }

  static getInstance() {
    if (!WebSocketServiceGlobal.instance) {
      WebSocketServiceGlobal.instance = new WebSocketServiceGlobal(
        'wss://[websocket url]'
      )
      WebSocketServiceGlobal.instance.connect()
    }
    return WebSocketServiceGlobal.instance
  }

  connect() {
    this.websocket = new WebSocket(this.url)
    this.websocket.onmessage = (event) =>
      this.messageHandlers.forEach((handler) => handler(event))
    this.websocket.onopen = (event) =>
      this.openHandlers.forEach((handler) => handler(event))
    this.websocket.onclose = (event) =>
      this.closeHandlers.forEach((handler) => handler(event))
  }

  addMessageHandler(handler): void {
    this.messageHandlers.push(handler)
  }

  addOpenHandler(handler): void {
    this.openHandlers.push(handler)
  }

  addCloseHandler(handler): void {
    this.closeHandlers.push(handler)
  }

  removeMessageHandler(handler): void {
    this.messageHandlers = this.messageHandlers.filter((h) => h !== handler)
  }

  removeOpenHandler(handler): void {
    this.openHandlers = this.openHandlers.filter((h) => h !== handler)
  }

  removeCloseHandler(handler): void {
    this.closeHandlers = this.closeHandlers.filter((h) => h !== handler)
  }

  sendMessage(message: string): void {
    this.websocket.send(JSON.stringify(message))
  }

  disconnect(): void {
    this.websocket.close()
  }
}

export default WebSocketServiceGlobal
