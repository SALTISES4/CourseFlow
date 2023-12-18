import React from 'react'
import { TinyLoader } from '@cfRedux/helpers.js'
import { LiveAssignmentMenu } from '@cfViews/LiveAssignmentView'

/*******************************************************
 * @LiveAssignmentRenderer
 *******************************************************/
class LiveAssignmentRenderer extends React.Component {
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

export default LiveAssignmentRenderer
