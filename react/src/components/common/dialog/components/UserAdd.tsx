import * as React from 'react'
// import $ from 'jquery'
import * as Constants from '@cfConstants'
import UserLabel from '@cfCommonComponents/dialog/components/UserLabel'
import { getUserListQuery } from '@XMLHTTP/API/sharing'

type StateProps = {
  selected: boolean
}

type PropsType = {
  share_info: any
  permissionChange: any
  data?: any
}

class UserAdd extends React.Component<PropsType, StateProps> {
  private input: React.RefObject<HTMLInputElement>
  constructor(props) {
    super(props)
    this.input = React.createRef()
    this.state = { selected: null }
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    const component = this
    $(this.input.current).autocomplete({
      source: (request, response_function) => {
        getUserListQuery(request.term, (response) => {
          const user_list = response.user_list.map((user) => {
            return {
              label:
                user.first_name + ' ' + user.last_name + ' - ' + user.username,
              value: user.username,
              user: user
            }
          })
          response_function(user_list)
        })
        component.setState({ selected: null })
      },
      select: (evt, ui) => {
        this.setState({ selected: ui.item.user })
      },
      minLength: 1
    })
  }
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  addClick(value) {
    if (this.state.selected) {
      this.props.permissionChange(
        Constants.permission_keys[value],
        this.state.selected
      )
      $(this.input.current).val(null)
      this.setState({ selected: null })
    }
  }
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let user
    if (this.state.selected) {
      user = (
        <UserLabel
          user={this.state.selected}
          type="add"
          addFunction={this.addClick.bind(this)}
        />
      )
    }

    return (
      <div className="user-add">
        <p>{this.props.share_info}</p>
        <div className="relative">
          <input
            className="search-input"
            ref={this.input}
            placeholder={window.gettext('Begin typing to search users')}
          />
          <span className="material-symbols-rounded">search</span>
        </div>
        {user}
      </div>
    )
  }
}

export default UserAdd
