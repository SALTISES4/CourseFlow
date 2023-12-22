import * as React from 'react'
import {
  setLiveProjectRole,
  getUsersForLiveProject,
  getUserList
} from '@XMLHTTP/PostFunctions'
import * as Constants from '@cfConstants'

class UserLabel extends React.Component {
  constructor(props) {
    super(props)
    this.select = React.createRef()
  }

  onChange(evt) {
    switch (evt.target.value) {
      case 'none':
        if (window.confirm('Are you sure you want to remove this user?')) {
          this.props.permissionChange(0, this.props.user)
        }
        break
      default:
        this.props.permissionChange(
          Constants.role_keys[evt.target.value],
          this.props.user
        )
    }
  }
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let permission_select
    if (this.props.type !== 'owner') {
      if (this.props.type === 'add') {
        permission_select = (
          <div className="permission-select">
            <select ref={this.select}>
              <option value="student">{gettext('Student')}</option>
              <option value="teacher">{gettext('Teacher')}</option>
            </select>
            <button
              onClick={() =>
                this.props.addFunction($(this.select.current).val())
              }
            >
              {window.gettext('Share')}
            </button>
          </div>
        )
      } else {
        permission_select = (
          <div className="permission-select">
            <select value={this.props.type} onChange={this.onChange.bind(this)}>
              <option value="student">{gettext('Student')}</option>
              <option value="teacher">{gettext('Teacher')}</option>
              <option value="none">{gettext('Remove user')}</option>
            </select>
          </div>
        )
      }
    }

    return (
      <li className="user-label">
        <div>
          <div className="user-name">
            {this.props.user.first_name + ' ' + this.props.user.last_name}
          </div>
          <div className="user-username">{this.props.user.username}</div>
        </div>
        {permission_select}
      </li>
    )
  }
}

class UserAdd extends React.Component {
  constructor(props) {
    super(props)
    this.input = React.createRef()
    this.state = { selected: null }
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    let component = this
    $(this.input.current).autocomplete({
      source: (request, response_function) => {
        getUserList(request.term, (response) => {
          let user_list = response.user_list.map((user) => {
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
        Constants.role_keys[value],
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
        <h4>{gettext('Add A User')}:</h4>
        <div>
          {gettext(
            'Begin typing to search users. Select the desired user then click Share.'
          )}
        </div>
        <input ref={this.input} />
        {user}
      </div>
    )
  }
}

class StudentManagement extends React.Component {
  constructor(props) {
    super(props)
    this.tiny_loader = new MouseCursorLoader($('body'))
    this.state = { owner: null, teacher: [], student: [] }
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    getUsersForLiveProject(this.props.data.id, (response) => {
      this.setState({
        owner: response.author,
        student: response.students,
        teacher: response.teachers
      })
    })
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  setUserPermission(permission_type, user) {
    COURSEFLOW_APP.tinyLoader.startLoad()
    setLiveProjectRole(user.id, this.props.data.id, permission_type, () => {
      getUsersForLiveProject(this.props.data.id, (response) => {
        this.setState({
          owner: response.author,
          student: response.students,
          teacher: response.teachers
        })
        COURSEFLOW_APP.tinyLoader.endLoad()
      })
    })
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    if (this.state.owner == null) return null
    let owner = <UserLabel user={this.state.owner} type={'owner'} />
    let teachers = this.state.teacher.map((user) => (
      <UserLabel
        user={user}
        type={'teacher'}
        permissionChange={this.setUserPermission.bind(this)}
      />
    ))
    let students = this.state.student.map((user) => (
      <UserLabel
        user={user}
        type={'student'}
        permissionChange={this.setUserPermission.bind(this)}
      />
    ))

    return (
      <div className="user-text">
        <h3>{gettext('Student Management') + ':'}</h3>
        <h4>{gettext('Owned By')}:</h4>
        <div>{owner}</div>
        <div className="user-panel">
          <h4>{gettext('Teachers')}:</h4>
          <ul className="user-list">{teachers}</ul>
        </div>
        <div className="user-panel">
          <h4>{gettext('Enrolled Users')}:</h4>
          <ul className="user-list">{students}</ul>
        </div>
        <UserAdd permissionChange={this.setUserPermission.bind(this)} />
      </div>
    )
  }
}

export default StudentManagement
