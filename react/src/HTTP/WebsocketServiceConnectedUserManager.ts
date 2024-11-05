import { WS_EVENT_TYPE, WebSocketService } from '@cf/HTTP/WebSocketService'
import ThemeHelper from "@cf/utility/ThemeHelper.class";
import { EUser } from '@XMLHTTP/types/entity'

export type ConnectedUser = {
  user: EUser
  userColour: string
  connected: boolean
  timeout: NodeJS.Timeout
}



type UpdateStateCallback = (users: ConnectedUser[]) => void

class WebSocketServiceConnectedUserManager {
  private websocketService: WebSocketService
  private updateStateCallback: UpdateStateCallback
  private connectedUsers: ConnectedUser[]
  private userUpdateInterval: NodeJS.Timeout | null

  // how is currenUser set?
  private currenUser: EUser

  constructor(
    websocket: WebSocketService,
    updateStateCallback: UpdateStateCallback
  ) {
    this.websocketService = websocket
    this.updateStateCallback = updateStateCallback
    this.connectedUsers = []
    this.userUpdateInterval = null
  }

  /**
   * method to initiate user update intervals
   * this should probably just send the id (or really nothing at all as payload)
   **/
  public startUserUpdates(user: EUser): void {
    this.currenUser = user
    this.userUpdateInterval = setInterval(
      () => this.sendConnectionUpdate(),
      10000
    )
  }

  /*******************************************************
   * Call this method to clear user update intervals
   *******************************************************/
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

    const payLoad = {
      user: this.currenUser,
      userColour: ThemeHelper.calcColor(this.currenUser.id),
      connected: connected
    }

    this.websocketService.send(
      JSON.stringify({
        type: WS_EVENT_TYPE.CONNECTION_UPDATE,
        payload: payLoad
      })
    )
  }

  public connectionUpdateReceived(userData: ConnectedUser): void {
    const index = this.connectedUsers.findIndex(
      (u) => u.user.id === userData.user.id
    )
    if (index !== -1) {
      if (this.connectedUsers[index].timeout) {
        clearTimeout(this.connectedUsers[index].timeout)
      }

      this.connectedUsers[index] = {
        ...userData,
        timeout: setTimeout(
          () => this.removeConnection(userData.user.id),
          60000
        )
      }
    } else {
      this.connectedUsers.push({
        ...userData,
        timeout: setTimeout(
          () => this.removeConnection(userData.user.id),
          60000
        )
      })
    }
    this.updateStateCallback(this.connectedUsers)
  }

  private removeConnection(userId: number): void {
    const index = this.connectedUsers.findIndex((u) => u.user.id === userId)
    if (index !== -1) {
      if (this.connectedUsers[index].timeout) {
        clearTimeout(this.connectedUsers[index].timeout)
      }
      this.connectedUsers.splice(index, 1)
      this.updateStateCallback(this.connectedUsers)
    }
  }
}

export default WebSocketServiceConnectedUserManager
