import * as React from 'react'
import { WorkflowTitle } from '@cfUIComponents'
import WorkflowCard from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCard'

/*******************************************************
  A container for workflow cards that allows searching and filtering

  Accepts a list of workflows as props.
  Optional prop search_within restricts searches to the existing list of workflows.
 *******************************************************/
// @todo define props
class WorkflowCardCondensed extends WorkflowCard {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getButtons() {
    return null
  }

  getProjectTitle() {
    if (this.props.workflowData.project_title) {
      return (
        <div className="project-title">
          {this.props.workflowData.project_title}
        </div>
      )
    } else {
      return '-'
    }
  }
  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const data = this.props.workflowData
    const css_class =
      'workflow-for-menu simple-workflow hover-shade ' + data.type

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
          {this.getTypeIndicator()}
          <WorkflowTitle
            no_hyperlink={this.props.no_hyperlink}
            class_name="workflow-title"
            data={data}
          />
          {this.getButtons()}
          {this.getProjectTitle()}
        </div>
      </div>
    )
  }
}

export default WorkflowCardCondensed
