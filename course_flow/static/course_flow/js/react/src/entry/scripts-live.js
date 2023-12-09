/**
 * @TODO why is this different than scripts-library.js
 */
import React from 'react'
import * as reactDom from 'react-dom'
import {
  LiveProjectMenu,
  StudentLiveProjectMenu
} from '../Components/Views/LiveProjectView'
import 'flatpickr/dist/flatpickr.css'
import { LiveAssignmentMenu } from '../Components/Views/LiveAssignmentView'
import { TinyLoader } from '../redux/helpers.js'

/*******************************************************
 * @LiveProjectRenderer
 *******************************************************/
export class LiveProjectRenderer extends React.Component {
  constructor(props) {
    super(props)
    this.live_project_data = this.props.live_project_data
    this.project_data = this.data.props.project_data
    this.user_role = this.data.props.user_role
    this.user_permission = this.data.props.user_permission
  }

  render() {
    this.container = container
    this.tiny_loader = new TinyLoader($('body')[0])

    // return this.getContents(), container[0])
    return this.getContents()
  }

  getContents() {
    return user_role === 2 ? (
      <LiveProjectMenu
        renderer={this} // @todo tighten this interface
        project={this.project_data}
        liveproject={this.live_project_data}
      />
    ) : (
      <StudentLiveProjectMenu
        renderer={this} // @todo tighten this interface
        project={this.project_data}
        liveproject={this.live_project_data}
      />
    )
  }
}

/*******************************************************
 * @LiveAssignmentRenderer
 *******************************************************/
export class LiveAssignmentRenderer extends React.Component {
  constructor(props) {
    super(props)
    this.live_project_data = this.props.live_project_data
    this.assignment_data = this.props.assignment_data
    this.user_role = this.props.user_role
  }

  render() {
    this.container = container
    this.tiny_loader = new TinyLoader($('body')[0])

    return this.getContents()
  }

  getContents() {
    return (
      <LiveAssignmentMenu
        renderer={this}
        assignment_data={this.assignment_data}
        live_project_data={this.live_project_data}
      />
    )
  }
}
