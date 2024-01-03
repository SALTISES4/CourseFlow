import * as React from 'react'

// @todo not sure where this goes

//Container for common elements for workflows
export class ConnectionBar extends React.Component {
  constructor(props) {
    super(props)
    this.state = { connected_users: [] }
    this.user_id = props.renderer.user_id
    // this.user_name = props.renderer.user_name
    this.user_name = COURSEFLOW_APP.contextData.user_name
    // this.myColour = props.renderer.myColour
    this.myColour = COURSEFLOW_APP.contextData.user_name

    const connection_bar = this

    props.renderer.connection_update_received = (user_data) => {
      connection_bar.connection_update_received(user_data)
    }
  }

  render() {
    if (this.props.updateSocket.readyState === 1) {
      const users = this.state.connected_users.map((user) => {
        return <ConnectedUser user_data={user} />
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
    } else if (this.props.updateSocket.readyState === 3) {
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
    clearTimeout(this.connection_update.bind(this))
    if (this.props.updateSocket.readyState === 1) {
      this.props.updateSocket.send(
        JSON.stringify({
          type: 'connection_update',
          user_data: {
            // user_id: this.user_id,
            // user_name: this.user_name, // why?
            // user_colour: this.myColour, // why?
            user_id: this.user_id,
            user_name: this.user_name, // why?
            user_colour: this.myColour, // why?
            connected: connected
          }
        })
      )
    }
    setTimeout(this.connection_update.bind(this), 30000)
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

export class ConnectedUser extends React.Component {
  render() {
    const data = this.props.user_data
    console.log('this.props.user_data')
    console.log(this)
    return (
      <div
        className="user-indicator"
        style={{
          backgroundColor: data.user_colour
        }}
        title={data.user_name}
      >
        {data.user_name}
      </div>
    )
  }
}
