import * as React from 'react'
import * as Constants from '../../../Constants.js'
import { AssignmentTitle } from '../../components/CommonComponents.js'

class AssignmentViewSmall extends React.Component {
  render() {
    let data = this.props.data
    let node_data = data.task
    let data_override
    if (node_data.represents_workflow)
      data_override = {
        ...node_data,
        ...node_data.linked_workflow_data,
        id: data.id
      }
    else data_override = { ...node_data }

    let css_class = 'node assignment'
    let style = { backgroundColor: Constants.getColumnColour(node_data) }
    return (
      <div style={style} className={css_class}>
        <div className="node-top-row">
          <AssignmentTitle
            user_role={this.props.renderer.user_role}
            data={data}
          />
        </div>
      </div>
    )
  }
}

export default AssignmentViewSmall
