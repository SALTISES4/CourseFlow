import * as React from 'react'

const ConnectedUser = ({
  user_colour,
  user_name
}: {
  user_colour: string
  user_name: string
}) => {
  return (
    <div
      className="user-indicator"
      style={{
        backgroundColor: user_colour
      }}
      title={user_name}
    >
      {user_name}
    </div>
  )
}

// @todo not sure where this goes

//Container for common elements for workflows
type ConnectedUserType = {
  user_name: string
  user_colour: string
  user_id: string
  timeout: string
}

type PropsType = {
  user_id: number
  websocket: WebSocket
  //  renderer: any
}

type StateType = {
  connected_users: ConnectedUserType[]
}

export class ConnectionBar extends React.Component<PropsType, StateType> {
  private user_name: string
  private myColour: string
  constructor(props: PropsType) {
    super(props)

    this.state = {
      connected_users: []
    }
    // this.user_id = props.renderer.user_id
    // this.user_name = props.renderer.user_name

    // @ts-ignore
    this.user_name = COURSEFLOW_APP.contextData.user_name
    // this.myColour = props.renderer.myColour

    // @ts-ignore
    this.myColour = COURSEFLOW_APP.contextData.user_name

    // @todo not sure what the intention is here, but it needs to be removed
    // watch for side effects
    // this.props.renderer.connection_update_received = (user_data) => {
    //   this.connection_update_received(user_data)
    // }
  }

  render() {
    if (this.props.websocket.readyState === 1) {
      const users = this.state.connected_users.map((user) => {
        return (
          <ConnectedUser
            user_colour={user.user_colour}
            user_name={user.user_name}
          />
        )
      })

      return (
        <div className="users-box">
          <div className="users-small-wrapper">
            <div className="users-small">{users.slice(0, 2)}</div>
          </div>
          <div className="users-more">...</div>
          <div className="users-hidden">{users}</div>
        </div>
      )
    } else if (this.props.websocket.readyState === 3) {
      return (
        <div className="users-box connection-failed">
          {window.gettext('Not Connected')}
        </div>
      )
    }
  }

  componentDidUpdate() {
    const element = document.querySelector('.users-box')
    const hasClass = element && element.classList.contains('connection-failed')
    if (hasClass) {
      this.connection_update()
    }
  }

  componentDidMount() {
    this.connection_update()
  }

  connection_update(connected = true) {
    const cache = this.connection_update.bind(this)

    // @todo can't clear a timeout which hasn't been set yet, fix
    // @ts-ignore
    clearTimeout(cache)

    if (this.props.websocket.readyState === 1) {
      this.props.websocket.send(
        JSON.stringify({
          type: 'connection_update',
          user_data: {
            // user_id: this.user_id,
            // user_name: this.user_name, // why?
            // user_colour: this.myColour, // why?
            user_id: this.props.user_id,
            user_name: this.user_name, // why?
            user_colour: this.myColour, // why?
            connected: connected
          }
        })
      )
    }
    setTimeout(cache, 30000)
  }

  connection_update_received(user_data) {
    if (user_data.connected) {
      const connected_users = this.state.connected_users.slice()
      let found_user = false
      for (let i = 0; i < connected_users.length; i++) {
        if (connected_users[i].user_id === user_data.user_id) {
          found_user = true
          clearTimeout(connected_users[i].timeout)
          connected_users[i] = {
            ...user_data,
            timeout: setTimeout(
              this.removeConnection.bind(this, user_data),
              60000
            )
          }
          break
        }
      }
      if (!found_user)
        connected_users.push({
          ...user_data,
          timeout: setTimeout(
            this.removeConnection.bind(this, user_data),
            60000
          )
        })
      this.setState({ connected_users: connected_users })
    } else {
      this.removeConnection(user_data)
    }
  }

  removeConnection(user_data) {
    const connected_users = this.state.connected_users.slice()
    for (let i = 0; i < connected_users.length; i++) {
      if (connected_users[i].user_id === user_data.user_id) {
        if (connected_users[i].timeout) clearTimeout(connected_users[i].timeout)
        connected_users.splice(i, 1)
        break
      }
    }
    this.setState({ connected_users: connected_users })
  }
}

export default ConnectionBar
