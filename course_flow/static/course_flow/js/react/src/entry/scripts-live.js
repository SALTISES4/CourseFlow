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
export class LiveProjectRenderer {
  constructor(live_project_data, project_data) {
    this.live_project_data = live_project_data
    this.project_data = project_data
    this.user_role = user_role
    this.user_permission = user_permission
  }

  render(container) {
    this.container = container
    this.tiny_loader = new TinyLoader($('body')[0])

    reactDom.render(this.getContents(), container[0])
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
export class LiveAssignmentRenderer {
  constructor(assignment_data, live_project_data) {
    this.live_project_data = live_project_data
    this.assignment_data = assignment_data
    this.user_role = user_role
  }

  render(container) {
    this.container = container
    this.tiny_loader = new TinyLoader($('body')[0])

    reactDom.render(this.getContents(), container[0])
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
