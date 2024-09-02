// Only used in classroom view. Should be removed/replaced.
import * as React from 'react'
import { WorkflowTitle } from '@cfCommonComponents/UIComponents/Titles'
import { _t } from '@cf/utility/utilityFunctions'

class WorkflowCardSimple extends React.Component {
  constructor(props) {
    super(props)
    this.mainDiv = React.createRef()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  clickAction() {
    if (this.props.selectAction) {
      this.props.selectAction(this.props.workflow_data.id)
    } else {
      window.location.href = COURSEFLOW_APP.globalContextData.path.update_path[
        this.props.workflow_data.type
      ].replace('0', this.props.workflow_data.id)
    }
  }

  getTypeIndicator() {
    const data = this.props.workflow_data
    const type = data.type
    let type_text = _t(type)
    if (type === 'liveproject') type_text = _t('classroom')
    if (data.is_strategy) type_text += _t(' strategy')
    return <div className={'workflow-type-indicator ' + type}>{type_text}</div>
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.workflow_data
    const css_class =
      'simple-workflow workflow-for-menu hover-shade ' + data.type

    return (
      <div
        ref={this.mainDiv}
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

export default WorkflowCardSimple
