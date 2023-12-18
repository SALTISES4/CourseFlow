import * as React from 'react'
import * as Utility from '@cfUtility'
import * as Constants from '@cfConstants'
import { WorkflowTitle } from '@cfUIComponents'
import { setWorkflowVisibility, toggleFavourite } from '@XMLHTTP/PostFunctions'

/*******************************************************
 * A workflow card for a menu
 *
 * Props must include workflow_data (serialized model) and context.
 * Context will determine which actions are added.
 *
 * Can also optionally receive a clickAction prop to override the behaviour
 * on c
 *******************************************************/
// @todo define props
class WorkflowForMenu extends React.Component {
  constructor(props) {
    super(props)
    this.state = { favourite: props.workflow_data.favourite }
    this.maindiv = React.createRef()
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getTypeIndicator() {
    let data = this.props.workflow_data
    let type = data.type
    let type_text = window.gettext(type)
    if (type === 'liveproject') type_text = window.gettext('classroom')
    if (data.is_strategy) type_text += window.gettext(' strategy')
    return (
      <div className={'workflow-type-indicator ' + type}>
        {Utility.capWords(type_text)}
      </div>
    )
  }

  getButtons() {
    let fav_class = ''
    if (this.state.favourite) fav_class = ' filled'
    let buttons = []
    if (this.props.workflow_data.type !== 'liveproject')
      buttons.push(
        <div
          key="btn-workflow-toggle-favourite"
          className="workflow-toggle-favourite hover-shade"
          onClick={(evt) => {
            toggleFavourite(
              this.props.workflow_data.id,
              this.props.workflow_data.type,
              !this.state.favourite
            )
            let state = this.state
            this.setState({ favourite: !state.favourite })
            evt.stopPropagation()
          }}
        >
          <span
            className={'material-symbols-outlined' + fav_class}
            title={window.gettext('Favourite')}
          >
            star
          </span>
        </div>
      )
    let workflows = []
    if (
      this.props.workflow_data.type === 'project' &&
      !(this.props.workflow_data.workflow_count == null)
    )
      workflows.push(
        <div key="workflow-created-count" className="workflow-created">
          {this.props.workflow_data.workflow_count +
            ' ' +
            window.gettext('workflows')}
        </div>
      )
    if (
      this.props.workflow_data.type == 'project' &&
      this.props.workflow_data.has_liveproject &&
      this.props.workflow_data.object_permission.role_type !==
        Constants.role_keys['none']
    )
      workflows.push(
        <div
          key="workflow-created-group"
          className="workflow-created workflow-live-classroom"
        >
          <span
            className="material-symbols-rounded small-inline"
            title={window.gettext('Live Classroom')}
          >
            group
          </span>
          {' ' + window.gettext('Live Classroom')}
        </div>
      )
    if (this.props.workflow_data.is_linked)
      workflows.push(
        <div
          key="workflow-created-warning"
          className="workflow-created linked-workflow-warning"
          title={window.gettext(
            'Warning: linking the same workflow to multiple nodes can result in loss of readability if you are associating parent workflow outcomes with child workflow outcomes.'
          )}
        >
          <span className="material-symbols-rounded red filled small-inline">
            error
          </span>
          {' ' + window.gettext('Already in use')}
        </div>
      )
    return (
      <div className="workflow-buttons-row">
        <div>{buttons}</div>
        <div>{workflows}</div>
      </div>
    )
  }

  clickAction() {
    if (this.props.selectAction) {
      this.props.selectAction(this.props.workflow_data.id)
    } else {
      window.location.href = COURSEFLOW_APP.config.update_path[
        this.props.workflow_data.type
      ].replace('0', this.props.workflow_data.id)
    }
  }

  getVisible() {
    let component = this
    if (
      this.props.renderer &&
      !this.props.renderer.read_only &&
      this.props.renderer.user_role === Constants.role_keys.teacher &&
      this.props.workflow_data.type !== 'project' &&
      this.props.workflow_data.type !== 'liveproject' &&
      this.props.renderer &&
      this.props.renderer.user_role === Constants.role_keys.teacher
    )
      return (
        <div
          className="permission-select"
          onClick={(evt) => evt.stopPropagation()}
          onMouseDown={(evt) => evt.stopPropagation()}
        >
          <select
            value={this.props.workflow_data.is_visible}
            onChange={(evt) =>
              component.visibilityFunction(
                this.props.workflow_data.id,
                evt.target.value
              )
            }
          >
            <option value={'false'}>{window.gettext('Not Visible')}</option>
            <option value={'true'}>{window.gettext('Visible')}</option>
          </select>
        </div>
      )
    return null
  }

  visibilityFunction(id, is_visible) {
    is_visible = is_visible === 'true'
    this.props.updateWorkflow(id, {
      is_visible: is_visible
    })
    setWorkflowVisibility(this.props.renderer.project_data.id, id, is_visible)
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.props.workflow_data
    let css_class = 'workflow-for-menu hover-shade ' + data.type
    if (this.props.selected) css_class += ' selected'

    let creation_text = window.gettext('Created')
    if (data.author && data.author !== 'None')
      creation_text += ' ' + window.gettext('by') + ' ' + data.author
    creation_text += window.gettext(' on ') + data.created_on
    let description = data.description
    if (!description) description = ' '

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
          <WorkflowTitle
            no_hyperlink={this.props.no_hyperlink}
            class_name="workflow-title"
            data={data}
          />
          {this.getVisible()}
          {this.getTypeIndicator()}
        </div>
        <div className="workflow-created">{creation_text}</div>
        <div
          className="workflow-description collapsible-text"
          dangerouslySetInnerHTML={{ __html: description }}
        />
        {this.getButtons()}
      </div>
    )
  }
}

export default WorkflowForMenu
