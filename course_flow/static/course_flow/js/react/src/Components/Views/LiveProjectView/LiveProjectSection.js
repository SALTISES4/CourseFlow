import * as React from 'react'
import {
  getLiveProjectData,
  getLiveProjectDataStudent
} from '../../../PostFunctions.js'

export class LiveProjectSection extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    let component = this
    if (this.props.role == 'teacher') {
      getLiveProjectData(this.props.objectID, this.props.view_type, (data) => {
        component.setState({ data: data.data_package })
      })
    } else if (this.props.role == 'student') {
      getLiveProjectDataStudent(
        this.props.objectID,
        this.props.view_type,
        (data) => {
          component.setState({ data: data.data_package })
        }
      )
    }
  }

  defaultRender() {
    // @todo undefined scope error
    return <window.renderers.WorkflowLoader />
  }
}
