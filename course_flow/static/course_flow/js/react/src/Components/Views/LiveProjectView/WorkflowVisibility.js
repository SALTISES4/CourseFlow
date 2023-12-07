import * as React from 'react'
import { WorkflowTitle } from '../../components/CommonComponents/UIComponents'
import { WorkflowForMenu } from '../../components/MenuComponents/menus/index.js'

// @todo circular dependency, wait till merge
class WorkflowVisibility extends WorkflowForMenu {
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  clickAction() {
    return null
  }

  getButtons() {
    return (
      <div className="permission-select">
        <select
          value={this.props.visibility}
          onChange={(evt) =>
            this.props.visibilityFunction(
              this.props.workflow_data.id,
              evt.target.value
            )
          }
        >
          <option value="not_visible">{gettext('Not Visible')}</option>
          <option value="visible">{gettext('Visible')}</option>
        </select>
      </div>
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    var data = this.props.workflow_data
    var css_class =
      'workflow-for-menu workflow-visibility hover-shade ' + data.type
    if (this.props.selected) css_class += ' selected'

    let creation_text = gettext('Created')
    if (data.author && data.author !== 'None')
      creation_text += ' ' + gettext('by') + ' ' + data.author
    creation_text += ' ' + data.created_on

    return (
      <div ref={this.maindiv} className={css_class}>
        <div className="workflow-top-row">
          <WorkflowTitle class_name="workflow-title" data={data} />
          {this.getButtons()}
          {this.getTypeIndicator()}
        </div>
        <div className="workflow-created">{creation_text}</div>
        <div
          className="workflow-description"
          dangerouslySetInnerHTML={{ __html: data.description }}
        />
      </div>
    )
  }
}

export default WorkflowVisibility
