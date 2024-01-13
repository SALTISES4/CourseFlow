import * as React from "react";
import * as Constants from "@cfConstants";
import $ from "jquery";

type StateProps = {
  published: boolean
  selected: boolean
}

type PropsType = {
  user: any
  type: any
  permissionChange?: any
  cannot_change?: any
  share_info?: any
  addFunction?: any
}

class UserLabel extends React.Component<PropsType, StateProps> {
  private select: React.RefObject<HTMLSelectElement>
  constructor(props: PropsType) {
    super(props)
    this.select = React.createRef()
  }

  /*******************************************************
   * FUNCTIONSw
   *******************************************************/
  onChange(evt) {
    switch (evt.target.value) {
      case 'none':
        if (window.confirm('Are you sure you want to remove this user?')) {
          this.props.permissionChange(0, this.props.user)
        }
        break
      default:
        this.props.permissionChange(
          Constants.permission_keys[evt.target.value],
          this.props.user
        )
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let permission_select
    let disabled = false
    if (
      this.props.cannot_change &&
      this.props.cannot_change.indexOf(this.props.user.id) >= 0
    )
      disabled = true
    if (this.props.type !== 'owner') {
      if (this.props.type === 'add') {
        permission_select = (
          <div className="flex-middle">
            <div className="permission-select">
              <select ref={this.select} disabled={disabled}>
                <option value="edit">{window.gettext('Can edit')}</option>
                <option value="comment">{window.gettext('Can comment')}</option>
                <option value="view">{window.gettext('Can view')}</option>
              </select>
            </div>
            <button
              className="primary-button"
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
            <select
              value={this.props.type}
              disabled={disabled}
              onChange={this.onChange.bind(this)}
            >
              <option value="edit">{window.gettext('Can edit')}</option>
              <option value="comment">{window.gettext('Can comment')}</option>
              <option value="view">{window.gettext('Can view')}</option>
              <option value="none">{window.gettext('Remove user')}</option>
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

export default UserLabel
