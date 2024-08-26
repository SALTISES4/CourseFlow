export type ConnectedUser = {
  user_id: string
  user_name: string
  user_colour: string
  connected: boolean
  timeout: Timeout
}
const calcColor = (id: number) =>
  'hsl(' + (((id * 5) % 360) + 1) + ', 50%, 50%)'

type UpdateStateCallback = (users: ConnectedUser[]) => void

class WebSocketServiceConnectedUserManager {
  private websocket: WebSocket
  private updateStateCallback: UpdateStateCallback
  private connectedUsers: ConnectedUser[]
  private userUpdateInterval: NodeJS.Timeout | null

  constructor(websocket: WebSocket, updateStateCallback: UpdateStateCallback) {
    this.websocket = websocket
    this.updateStateCallback = updateStateCallback
    this.connectedUsers = []
    this.userUpdateInterval = null
  }

  // Call this method to initiate user update intervals
  public startUserUpdates(): void {
    this.userUpdateInterval = setInterval(
      () => this.sendConnectionUpdate(),
      30000
    )
  }

  // Call this method to clear user update intervals
  public stopUserUpdates(): void {
    if (this.userUpdateInterval) {
      clearInterval(this.userUpdateInterval)
      this.userUpdateInterval = null
    }
  }

  private sendConnectionUpdate(connected = true): void {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) return

    this.websocket.send(
      JSON.stringify({
        type: 'connection_update',
        user_data: {
          user_id: this.userId,
          user_name: this.userName,
          user_colour: calcColor(user_id),
          connected: connected
        }
      })
    )
  }

  public connectionUpdateReceived(user_data: ConnectedUser): void {
    const index = this.connectedUsers.findIndex(
      (u) => u.user_id === user_data.user_id
    )
    if (index !== -1) {
      if (this.connectedUsers[index].timeout)
        clearTimeout(this.connectedUsers[index].timeout)
      this.connectedUsers[index] = {
        ...user_data,
        timeout: setTimeout(
          () => this.removeConnection(user_data.user_id),
          60000
        )
      }
    } else {
      this.connectedUsers.push({
        ...user_data,
        timeout: setTimeout(
          () => this.removeConnection(user_data.user_id),
          60000
        )
      })
    }
    this.updateStateCallback(this.connectedUsers)
  }

  private removeConnection(userId: string): void {
    const index = this.connectedUsers.findIndex((u) => u.user_id === userId)
    if (index !== -1) {
      if (this.connectedUsers[index].timeout)
        clearTimeout(this.connectedUsers[index].timeout)
      this.connectedUsers.splice(index, 1)
      this.updateStateCallback(this.connectedUsers)
    }
  }
}

export default WebSocketServiceConnectedUserManager
