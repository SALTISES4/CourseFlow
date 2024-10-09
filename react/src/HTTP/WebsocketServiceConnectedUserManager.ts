import { WebSocketService } from '@cf/HTTP/WebSocketService'

type CurrentUser = {
  userId: number
  userName: string
}

export type ConnectedUser = {
  userId: string
  userName: string
  userColour: string
  connected: boolean
  timeout: NodeJS.Timeout
}

const calcColor = (id: number) =>
  'hsl(' + (((id * 5) % 360) + 1) + ', 50%, 50%)'

type UpdateStateCallback = (users: ConnectedUser[]) => void

class WebSocketServiceConnectedUserManager {
  private websocketService: WebSocketService
  private updateStateCallback: UpdateStateCallback
  private connectedUsers: ConnectedUser[]
  private userUpdateInterval: NodeJS.Timeout | null
  private currenUser: CurrentUser

  constructor(
    websocket: WebSocketService,
    updateStateCallback: UpdateStateCallback
  ) {
    this.websocketService = websocket
    this.updateStateCallback = updateStateCallback
    this.connectedUsers = []
    this.userUpdateInterval = null
  }

  // Call this method to initiate user update intervals
  public startUserUpdates(user: CurrentUser): void {
    this.currenUser = user
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
    if (
      !this.websocketService ||
      this.websocketService.getState() !== WebSocket.OPEN
    ) {
      return
    }

    this.websocketService.send(
      JSON.stringify({
        type: 'connection_update',
        userData: {
          userId: this.currenUser.userId,
          userName: this.currenUser.userName,
          userColour: calcColor(Number(this.currenUser.userId)),
          connected: connected
        }
      })
    )
  }

  public connectionUpdateReceived(userData: ConnectedUser): void {
    const index = this.connectedUsers.findIndex(
      (u) => u.userId === userData.userId
    )
    if (index !== -1) {
      if (this.connectedUsers[index].timeout)
        clearTimeout(this.connectedUsers[index].timeout)
      this.connectedUsers[index] = {
        ...userData,
        timeout: setTimeout(
          () => this.removeConnection(userData.userId),
          60000
        )
      }
    } else {
      this.connectedUsers.push({
        ...userData,
        timeout: setTimeout(
          () => this.removeConnection(userData.userId),
          60000
        )
      })
    }
    this.updateStateCallback(this.connectedUsers)
  }

  private removeConnection(userId: string): void {
    const index = this.connectedUsers.findIndex((u) => u.userId === userId)
    if (index !== -1) {
      if (this.connectedUsers[index].timeout)
        clearTimeout(this.connectedUsers[index].timeout)
      this.connectedUsers.splice(index, 1)
      this.updateStateCallback(this.connectedUsers)
    }
  }
}

export default WebSocketServiceConnectedUserManager
