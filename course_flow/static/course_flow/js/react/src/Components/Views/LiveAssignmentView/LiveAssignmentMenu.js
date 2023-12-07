import * as React from 'react'
import * as reactDom from 'react-dom'
import { AssignmentView } from './LiveAssignmentView.js'
import * as Utility from '../../../UtilityFunctions.js'
import { DatePicker } from '../../components/CommonComponents/UIComponents'
import {
  addUsersToAssignment,
  deleteSelfLive,
  getAssignmentData,
  setAssignmentCompletion,
  setWorkflowVisibility,
  updateLiveProjectValue
} from '../../../XMLHTTP/PostFunctions.js'
import WorkflowVisibility from '../LiveProjectView/WorkflowVisibility.js'

/**
 *
 */
class ReportRow extends React.Component {
  render() {
    let user = this.props.userassignment.liveprojectuser
    let userassignment = this.props.userassignment
    let updateFunction = this.props.updateFunction
    return (
      <tr>
        <td>
          {Utility.getUserDisplay(user.user) +
            ' (' +
            user.role_type_display +
            ')'}
        </td>
        <td>
          <input
            type="checkbox"
            checked={userassignment.completed}
            onChange={(evt) =>
              updateFunction(userassignment.id, evt.target.checked)
            }
          />
        </td>
      </tr>
    )
  }
}

/**
 *
 */
class LiveAssignmentEdit extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      ...this.props.data,
      has_changed: false,
      user_data: { assigned_users: [], other_users: [] }
    }
    this.changed_values = {}
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    let component = this
    getAssignmentData(
      component.props.data.id,
      component.props.view_type,
      (data) => {
        component.setState({ user_data: data.data_package })
      }
    )
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  switchVisibility(pk, visibility) {
    let parameter = 'workflow_access'
    if (this.state.task.linked_workflow === pk)
      parameter = 'linked_' + parameter
    if (visibility === 'visible') {
      setWorkflowVisibility(this.props.live_project_data.pk, pk, true)
      let new_state = {}
      new_state[parameter] = true
      this.props.updateAssignment(new_state)
      this.setState(new_state)
    } else {
      setWorkflowVisibility(this.props.live_project_data.pk, pk, false)
      let new_state = {}
      new_state[parameter] = false
      this.props.updateAssignment(new_state)
      this.setState(new_state)
    }
  }

  delete() {
    let data = this.state
    if (
      window.confirm(
        gettext('Are you sure you want to delete this ') +
          gettext('assignment') +
          '?'
      )
    ) {
      deleteSelfLive(data.id, 'liveassignment', (response_data) => {
        window.location = window.config.update_path.liveproject.replace(
          '0',
          data.liveproject
        )
      })
    }
  }

  changeField(type, new_value) {
    let new_state = { has_changed: true }
    new_state[type] = new_value
    this.changed_values[type] = new_value
    this.setState(new_state)
  }

  saveChanges() {
    updateLiveProjectValue(this.state.id, 'liveassignment', this.changed_values)
    this.props.updateAssignment(this.changed_values)
    this.changed_values = {}
    this.setState({ has_changed: false })
  }

  changeView(workflow_id) {
    this.setState({ selected_id: workflow_id })
  }

  addUser(evt) {
    let selected = parseInt($('#users_all').val())
    if (!selected) return
    let user_data = { ...this.state.user_data }
    user_data.assigned_users = user_data.assigned_users.slice()
    user_data.other_users = user_data.other_users.slice()
    user_data.assigned_users.push(
      user_data.other_users.splice(
        user_data.other_users.findIndex(
          (element) => element.user.id == selected
        ),
        1
      )[0]
    )
    this.setState({ user_data: user_data })
    addUsersToAssignment(this.state.id, [selected], true)
  }

  removeUser(evt) {
    let selected = parseInt($('#users_chosen').val())
    if (!selected) return
    let user_data = { ...this.state.user_data }
    user_data.assigned_users = user_data.assigned_users.slice()
    user_data.other_users = user_data.other_users.slice()
    user_data.other_users.push(
      user_data.assigned_users.splice(
        user_data.assigned_users.findIndex(
          (element) => element.user.id == selected
        ),
        1
      )[0]
    )
    this.setState({ user_data: user_data })
    addUsersToAssignment(this.state.id, [selected], false)
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.state
    let changeField = this.changeField.bind(this)
    let assigned_users = this.state.user_data.assigned_users.map((user) => (
      <option value={user.user.id}>
        {Utility.getUserDisplay(user.user) +
          ' (' +
          user.role_type_display +
          ')'}
      </option>
    ))
    let other_users = this.state.user_data.other_users.map((user) => (
      <option value={user.user.id}>
        {Utility.getUserDisplay(user.user) +
          ' (' +
          user.role_type_display +
          ')'}
      </option>
    ))

    let linked_workflow
    if (this.state.task.linked_workflow) {
      let visibility = 'not_visible'
      if (this.state.linked_workflow_access) visibility = 'visible'
      let warning
      if (!this.state.linked_workflow_access)
        warning = (
          <div className="warning">
            {gettext(
              'Warning: the linked workflow is not visible to those in the classroom'
            )}
          </div>
        )
      linked_workflow = [
        <h4>{gettext('Linked Workflow')}:</h4>,
        warning,
        <WorkflowVisibility
          workflow_data={this.state.task.linked_workflow_data}
          visibility={visibility}
          visibilityFunction={this.switchVisibility.bind(this)}
        />
      ]
    }
    let parent_workflow
    if (this.state.user_data.parent_workflow) {
      let parent_visibility = 'not_visible'
      if (this.state.workflow_access) parent_visibility = 'visible'
      let warning
      if (!this.state.workflow_access)
        warning = (
          <div className="warning">
            {gettext(
              'Warning: the workflow the task appears in is not visible to those in the classroom'
            )}
          </div>
        )
      parent_workflow = [
        <h4>{gettext('Task Workflow')}:</h4>,
        warning,
        <WorkflowVisibility
          workflow_data={this.state.user_data.parent_workflow}
          visibility={parent_visibility}
          visibilityFunction={this.switchVisibility.bind(this)}
        />
      ]
    }
    return (
      <div className="workflow-details">
        <h3>{gettext('Configuration')}:</h3>
        <div>
          <label>{gettext('End Date')}: </label>
          <DatePicker
            id="end_date"
            default_value={data.end_date}
            onChange={this.changeField.bind(this, 'end_date')}
          />
        </div>
        <div>
          <label>{gettext('Start Date')}: </label>
          <DatePicker
            id="start_date"
            default_value={data.start_date}
            onChange={this.changeField.bind(this, 'start_date')}
          />
        </div>
        <div>
          <label
            htmlFor="single-completion"
            title={gettext(
              'Whether to mark the assignment as complete if any user has completed it.'
            )}
          >
            {gettext(
              'Mark assignment as complete when a single user has completed it:'
            )}
          </label>
          <input
            id="single-completion"
            name="single-completion"
            type="checkbox"
            checked={data.single_completion}
            onChange={(evt) =>
              changeField('single_completion', evt.target.checked)
            }
          />
        </div>
        <div>
          <label
            htmlFor="self-reporting"
            title={gettext(
              'Whether students can mark their own assignments as complete.'
            )}
          >
            {gettext('Let students self-report their assignment completion:')}
          </label>
          <input
            id="self-reporting"
            name="self-reporting"
            type="checkbox"
            checked={data.self_reporting}
            onChange={(evt) =>
              changeField('self_reporting', evt.target.checked)
            }
          />
        </div>
        <div>
          <button
            disabled={!this.state.has_changed}
            onClick={this.saveChanges.bind(this)}
          >
            {gettext('Save Changes')}
          </button>
        </div>
        <div>
          <button onClick={this.delete.bind(this)}>{gettext('Delete')}</button>
        </div>
        <h3>{gettext('Users')}:</h3>

        <div>
          <div className="multi-select">
            <h5>{gettext('Assigned Users')}</h5>
            <select id="users_chosen" multiple>
              {assigned_users}
            </select>
            <button id="remove-user" onClick={this.removeUser.bind(this)}>
              {' '}
              {gettext('Remove')}{' '}
            </button>
          </div>
          <div className="multi-select">
            <h5>{gettext('Other Users')}</h5>
            <select id="users_all" multiple>
              {other_users}
            </select>
            <button id="add-user" onClick={this.addUser.bind(this)}>
              {' '}
              {gettext('Add')}{' '}
            </button>
          </div>
        </div>
        <h3>{gettext('Workflows')}:</h3>
        {parent_workflow}
        {linked_workflow}
      </div>
    )
  }
}

/**
 *
 */
class LiveAssignmentReport extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  defaultRender() {
    return <window.renderers.WorkflowLoader />
  }

  updateCompletion(id, completed) {
    let userassignments = this.state.userassignments.slice()
    let index = userassignments.findIndex(
      (userassignment) => userassignment.id == id
    )
    userassignments[index] = { ...userassignments[index], completed: completed }
    setAssignmentCompletion(id, completed)
    this.setState({ userassignments: userassignments })
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    let component = this
    getAssignmentData(
      component.props.data.id,
      component.props.view_type,
      (data) => {
        component.setState({ ...data.data_package })
      }
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    if (!this.state.userassignments) {
      return this.defaultRender()
    }

    let rows = this.state.userassignments.map((assignment) => (
      <ReportRow
        userassignment={assignment}
        updateFunction={this.updateCompletion.bind(this)}
      />
    ))

    let total_completion = this.state.userassignments.reduce(
      (accumulator, currentValue) => accumulator + currentValue.completed,
      0
    )

    return (
      <div className="workflow-details">
        <h3>{gettext('Completion')}:</h3>
        <table>
          {rows}
          <tr>
            <td>{gettext('Total')}:</td>
            <td>
              {total_completion}/{this.state.userassignments.length}
            </td>
          </tr>
        </table>
      </div>
    )
  }
}

class LiveAssignmentMenu extends React.Component {
  constructor(props) {
    super(props)
    this.state = { view_type: 'edit', assignment_data: props.assignment_data }
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getViewButtons() {
    return [
      { type: 'edit', name: gettext('Edit') },
      { type: 'report', name: gettext('Report') }
    ]
  }

  changeView(view_type) {
    this.setState({ view_type: view_type })
  }

  getContent() {
    switch (this.state.view_type) {
      case 'edit':
        return (
          <LiveAssignmentEdit
            updateAssignment={this.updateAssignment.bind(this)}
            view_type={this.state.view_type}
            renderer={this.props.renderer}
            data={this.props.assignment_data}
            live_project_data={this.props.live_project_data}
          />
        )
      case 'report':
        return (
          <LiveAssignmentReport
            view_type={this.state.view_type}
            renderer={this.props.renderer}
            data={this.props.assignment_data}
          />
        )
    }
  }

  updateAssignment(new_values) {
    this.setState({
      assignment_data: { ...this.state.assignment_data, ...new_values }
    })
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let data = this.state.assignment_data
    let liveproject = this.props.live_project_data

    let view_buttons = this.getViewButtons().map((item) => {
      let view_class = 'hover-shade'
      if (item.type === this.state.view_type) view_class += ' active'
      return (
        <a
          id={'button_' + item.type}
          className={view_class}
          onClick={this.changeView.bind(this, item.type)}
        >
          {item.name}
        </a>
      )
    })

    return (
      <div className="project-menu">
        <div className="project-header">
          {reactDom.createPortal(
            <a
              id="live-project-return"
              href={window.config.update_path['liveproject'].replace(
                0,
                liveproject.pk
              )}
              className="hover-shade no-underline"
            >
              <span className="material-symbols-rounded">arrow_back_ios</span>
              <div>{gettext('Return to Classroom')}</div>
            </a>,
            $('.titlebar .title')[0]
          )}
          <AssignmentView renderer={this.props.renderer} data={data} />
        </div>

        <div className="workflow-view-select hide-print">{view_buttons}</div>
        <div className="workflow-container">{this.getContent()}</div>
      </div>
    )
  }
}

export default LiveAssignmentMenu
