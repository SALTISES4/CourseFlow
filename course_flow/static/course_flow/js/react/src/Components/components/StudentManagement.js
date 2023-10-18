import * as Redux from 'redux'
import * as React from 'react'
import * as reactDom from 'react-dom'
import {
  setLiveProjectRole,
  getUsersForLiveProject,
  getUserList
} from '../../PostFunctions.js'
import * as Constants from '../../Constants.js'

export class StudentManagement extends React.Component {
  constructor(props) {
    super(props)
    this.tiny_loader = new renderers.TinyLoader($('body'))
    this.state = { owner: null, teacher: [], student: [] }
  }

  render() {
    let data = this.props.data
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

    let text = data.title
    if (text == null || text == '') {
      text = gettext('Untitled')
    }

    return (
      <div class="user-text">
        <h3>{gettext('Student Management') + ':'}</h3>
        <h4>{gettext('Owned By')}:</h4>
        <div>{owner}</div>
        <div class="user-panel">
          <h4>{gettext('Teachers')}:</h4>
          <ul class="user-list">{teachers}</ul>
        </div>
        <div class="user-panel">
          <h4>{gettext('Enrolled Users')}:</h4>
          <ul class="user-list">{students}</ul>
        </div>
        <UserAdd permissionChange={this.setUserPermission.bind(this)} />
      </div>
    )
  }

  setUserPermission(permission_type, user) {
    this.tiny_loader.startLoad()
    setLiveProjectRole(user.id, this.props.data.id, permission_type, () => {
      getUsersForLiveProject(this.props.data.id, (response) => {
        this.setState({
          owner: response.author,
          student: response.students,
          teacher: response.teachers
        })
        this.tiny_loader.endLoad()
      })
    })
  }

  componentDidMount() {
    getUsersForLiveProject(this.props.data.id, (response) => {
      this.setState({
        owner: response.author,
        student: response.students,
        teacher: response.teachers
      })
    })
  }
}

class UserLabel extends React.Component {
  constructor(props) {
    super(props)
    this.select = React.createRef()
  }

  render() {
    let permission_select
    if (this.props.type != 'owner') {
      if (this.props.type == 'add') {
        permission_select = (
          <div class="permission-select">
            <select ref={this.select}>
              <option value="student">{gettext('Student')}</option>
              <option value="teacher">{gettext('Teacher')}</option>
            </select>
            <button
              onClick={() =>
                this.props.addFunction($(this.select.current).val())
              }
            >
              {gettext('Share')}
            </button>
          </div>
        )
      } else {
        permission_select = (
          <div class="permission-select">
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
      <li class="user-label">
        <div>
          <div class="user-name">
            {this.props.user.first_name + ' ' + this.props.user.last_name}
          </div>
          <div class="user-username">{this.props.user.username}</div>
        </div>
        {permission_select}
      </li>
    )
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
}

class UserAdd extends React.Component {
  constructor(props) {
    super(props)
    this.input = React.createRef()
    this.state = { selected: null }
  }

  render() {
    let disabled = this.state.selected === null

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
      <div class="user-add">
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
}
