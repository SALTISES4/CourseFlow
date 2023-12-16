// Only used in classroom view. Should be removed/replaced.
import * as React from 'react'
import { WorkflowTitle } from '@cfUIComponents/Titles.js'

class SimpleWorkflow extends React.Component {
  constructor(props) {
    super(props)
    this.maindiv = React.createRef()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  clickAction() {
    if (this.props.selectAction) {
      this.props.selectAction(this.props.workflow_data.id)
    } else {
      window.location.href = COURSEFLOW_APP.config.update_path[
        this.props.workflow_data.type
      ].replace('0', this.props.workflow_data.id)
    }
  }

  getTypeIndicator() {
    let data = this.props.workflow_data
    let type = data.type
    let type_text = window.gettext(type)
    if (type == 'liveproject') type_text = window.gettext('classroom')
    if (data.is_strategy) type_text += window.gettext(' strategy')
    return <div className={'workflow-type-indicator ' + type}>{type_text}</div>
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    var data = this.props.workflow_data
    var css_class = 'simple-workflow workflow-for-menu hover-shade ' + data.type

    return (
      <div
        ref={this.maindiv}
        className={css_class}
        onClick={this.clickAction.bind(this)}
        onMouseDown={(evt) => {
          evt.preventDefault()
        }}
      >
        <div className="workflow-top-row">
          <WorkflowTitle class_name="workflow-title" data={data} />
          {this.getTypeIndicator()}
        </div>
      </div>
    )
  }
}

export default SimpleWorkflow
