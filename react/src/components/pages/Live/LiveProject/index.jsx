import React from 'react'
import { TinyLoader } from '@cfRedux/helpers'
import {
  LiveProjectMenu,
  StudentLiveProjectMenu
} from '@cfViews/LiveProjectView'

/*******************************************************
 * @LiveProjectRenderer
 *******************************************************/
class LiveProjectRenderer extends React.Component {
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
    return this.user_role === 2 ? (
      <LiveProjectMenu
        renderer={this} // @todo tighten this interface
        project={this.project_data}
        liveproject={this.live_project_data}
      />
    ) : (
      <StudentLiveProjectMenu
        // renderer={this} // @todo tighten this interface
        project={this.project_data}
        liveproject={this.live_project_data}
      />
    )
  }
}

export default LiveProjectRenderer
