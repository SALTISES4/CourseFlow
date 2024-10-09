import { _t } from '@cf/utility/utilityFunctions'
import UserLabel from '@cfComponents/dialog/components/UserLabel'
import * as Constants from '@cfConstants'
import SearchIcon from '@mui/icons-material/Search'
import { getUserListQuery } from '@XMLHTTP/API/user'
import * as React from 'react'
// import $ from 'jquery'

type StateProps = {
  selected: number
}

type PropsType = {
  shareInfo: string
  permissionChange: (permissionType: number, user: number) => any
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
      source: (request, responseFunction) => {
        getUserListQuery(request.term, (response) => {
          const userList = response.dataPackage.userList.map((user) => {
            return {
              label:
                user.firstName + ' ' + user.lastName + ' - ' + user.username,
              value: user.username,
              user: user
            }
          })
          responseFunction(userList)
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
        Constants.permissionKeys[value],
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
        <p>{this.props.shareInfo}</p>
        <div className="relative">
          <input
            className="search-input"
            ref={this.input}
            placeholder={_t('Begin typing to search users')}
          />
          <SearchIcon />
        </div>
        {user}
      </div>
    )
  }
}

export default UserAdd
