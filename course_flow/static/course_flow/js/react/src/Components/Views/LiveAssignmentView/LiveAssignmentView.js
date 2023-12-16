import * as React from 'react'
import { AssignmentTitle, TitleText, DatePicker } from '@cfCommonComponents'
import { setAssignmentCompletion } from '@cfPostFunctions'
import * as Constants from '@cfConstants'
import * as Utility from '@cfUtility'

export class AssignmentView extends React.Component {
  constructor(props) {
    super(props)
    this.state = { is_dropped: false }
    if (props.data.user_assignment)
      this.state.completed = props.data.user_assignment.completed
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  visitWorkflow(id, evt) {
    let path = config.update_path['workflow']
    evt.stopPropagation()
    window.open(path.replace('0', id))
  }

  toggleDrop() {
    this.setState((state) => {
      return { is_dropped: !state.is_dropped }
    })
  }

  changeCompletion(evt) {
    let checked = evt.target.checked
    this.setState({ completed: checked })
    setAssignmentCompletion(this.props.data.user_assignment.id, checked)
  }

  /*******************************************************
   * RENDER
   *******************************************************/
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
    let lefticon
    let righticon
    if (node_data.context_classification > 0)
      lefticon = (
        <img
          title={
            renderer.context_choices.find(
              (obj) => obj.type == node_data.context_classification
            ).name
          }
          src={
            config.icon_path +
            Constants.context_keys[data.context_classification] +
            '.svg'
          }
        />
      )
    if (node_data.task_classification > 0)
      righticon = (
        <img
          title={
            renderer.task_choices.find(
              (obj) => obj.type == node_data.task_classification
            ).name
          }
          src={
            config.icon_path +
            Constants.task_keys[node_data.task_classification] +
            '.svg'
          }
        />
      )
    let style = { backgroundColor: Constants.getColumnColour(node_data) }
    let mouseover_actions = []
    let css_class = 'node assignment'
    if (this.state.is_dropped) css_class += ' dropped'

    let linkIcon
    let linktext = gettext('Visit linked workflow')
    let clickfunc = this.visitWorkflow.bind(this, node_data.linked_workflow)
    if (node_data.linked_workflow_data) {
      if (node_data.linked_workflow_data.deleted)
        linktext = gettext('<Deleted Workflow>')
      if (node_data.linked_workflow_data.deleted) clickfunc = null
    }
    if (data.linked_workflow_access && node_data.linked_workflow)
      linkIcon = (
        <div className="hover-shade linked-workflow" onClick={clickfunc}>
          <img src={config.icon_path + 'wflink.svg'} />
          <div>{linktext}</div>
        </div>
      )
    let parentLinkIcon
    let parentlinktext = gettext('Visit containing workflow')
    let parentclickfunc = this.visitWorkflow.bind(this, data.parent_workflow_id)
    if (data.workflow_access && data.parent_workflow_id)
      parentLinkIcon = (
        <div
          className="hover-shade linked-workflow containing-workflow"
          onClick={parentclickfunc}
        >
          <img src={config.icon_path + 'wflink.svg'} />
          <div>{parentlinktext}</div>
        </div>
      )
    let dropText = ''
    if (
      data_override.description &&
      data_override.description.replace(
        /(<p\>|<\/p>|<br>|\n| |[^a-zA-Z0-9])/g,
        ''
      ) != ''
    )
      dropText = '...'

    let dropIcon
    if (this.state.is_dropped) dropIcon = 'droptriangleup'
    else dropIcon = 'droptriangledown'

    let completion_data

    if (data.user_assignment) {
      let disabled = true
      if (
        this.props.renderer.user_role == Constants.role_keys.teacher ||
        (data.self_reporting &&
          data.user_assignment.liveprojectuser.user.id == user_id)
      )
        disabled = false
      let extra_data
      if (data.single_completion && data.user_assignment.completed) {
        extra_data = [
          <div>
            {gettext('Completed by ') +
              Utility.getUserDisplay(
                data.user_assignment.liveprojectuser.user
              ) +
              gettext(' on ')}
            <DatePicker
              default_value={data.user_assignment.completed_on}
              disabled={true}
            />
          </div>
        ]
      }
      completion_data = (
        <div>
          <label>{gettext('Completion')}: </label>
          <input
            type="checkbox"
            disabled={disabled}
            checked={this.state.completed}
            onChange={this.changeCompletion.bind(this)}
          />
          {extra_data}
        </div>
      )
    }

    return (
      <div style={style} className={css_class}>
        <div className="mouseover-actions">{mouseover_actions}</div>
        <div className="node-top-row">
          <div className="node-icon">{lefticon}</div>
          <AssignmentTitle
            user_role={this.props.renderer.user_role}
            data={data}
          />
          <div className="node-icon">{righticon}</div>
        </div>
        <div className="assignment-timing">
          <div>
            <div>
              <label>{gettext('End Date')}: </label>
              <DatePicker
                id="end_date"
                default_value={data.end_date}
                disabled={true}
              />
            </div>
            <div>
              <label>{gettext('Start Date')}: </label>
              <DatePicker
                id="start_date"
                default_value={data.start_date}
                disabled={true}
              />
            </div>
          </div>
          <div>{completion_data}</div>
        </div>
        {parentLinkIcon}
        {linkIcon}
        <div className="node-details">
          <TitleText
            text={data_override.description}
            defaultText={gettext('No description given')}
          />
        </div>
        <div
          className="node-drop-row hover-shade"
          onClick={this.toggleDrop.bind(this)}
        >
          <div className="node-drop-side node-drop-left">{dropText}</div>
          <div className="node-drop-middle">
            <img src={config.icon_path + dropIcon + '.svg'} />
          </div>
          <div className="node-drop-side node-drop-right">
            <div className="node-drop-time">
              {data_override.time_required &&
                data_override.time_required +
                  ' ' +
                  this.props.renderer.time_choices[data_override.time_units]
                    .name}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default AssignmentView
