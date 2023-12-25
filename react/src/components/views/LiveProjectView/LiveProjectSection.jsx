import * as React from 'react'
import {
  getLiveProjectDataQuery,
  getLiveProjectDataStudentQuery
} from '@XMLHTTP/PostFunctions'
import WorkflowLoader from '@cfUIComponents/WorkflowLoader.jsx'

class LiveProjectSection extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {
    let component = this
    if (this.props.role === 'teacher') {
      getLiveProjectDataQuery(
        this.props.objectID,
        this.props.view_type,
        (data) => {
          component.setState({ data: data.data_package })
        }
      )
    } else if (this.props.role === 'student') {
      getLiveProjectDataStudentQuery(
        this.props.objectID,
        this.props.view_type,
        (data) => {
          component.setState({ data: data.data_package })
        }
      )
    }
  }

  defaultRender() {
    return <WorkflowLoader />
  }
}

export default LiveProjectSection
