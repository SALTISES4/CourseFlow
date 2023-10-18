import * as React from 'react'
import * as reactDom from 'react-dom'
import {
  DatePicker,
  AssignmentTitle,
  WorkflowTitle,
  NodeTitle,
  TitleText,
  ActionButton,
  SimpleWorkflow
} from '../components/CommonComponents.js'
import {
  renderMessageBox,
  closeMessageBox
} from '../components/MenuComponents.js'
import { WorkflowForMenu } from '../../Library.js'
import {
  setAssignmentCompletion,
  updateLiveProjectValue,
  createAssignment,
  getLiveProjectData,
  getLiveProjectDataStudent,
  setWorkflowVisibility,
  getWorkflowNodes
} from '../../PostFunctions.js'
import { StudentManagement } from '../components/StudentManagement.js'
import { AssignmentView, AssignmentViewSmall } from './LiveAssignmentView.js'
import * as Constants from '../../Constants.js'
import * as Utility from '../../UtilityFunctions.js'

export class LiveProjectMenu extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      ...props.project,
      liveproject: this.props.liveproject,
      view_type: 'overview'
    }
  }

  render() {
    let data = this.props.project

    let overflow_links = []
    if (this.props.renderer.user_permission > 0) {
      overflow_links.push(
        <a
          id="project"
          class="hover-shade"
          href={config.update_path.project.replace('0', data.id)}
        >
          {gettext('Edit Project')}
        </a>
      )
    }

    let view_buttons = this.getViewButtons().map((item) => {
      let view_class = 'hover-shade'
      if (item.type == this.state.view_type) view_class += ' active'
      return (
        <a
          id={'button_' + item.type}
          class={view_class}
          onClick={this.changeView.bind(this, item.type)}
        >
          {item.name}
        </a>
      )
    })

    return (
      <div class="project-menu">
        <div class="project-header">
          <WorkflowForMenu
            no_hyperlink={true}
            workflow_data={this.state.liveproject}
            selectAction={this.openEdit.bind(this)}
          />
          {this.getHeader()}
        </div>

        <div class="workflow-view-select hide-print">{view_buttons}</div>
        <div class="workflow-container">{this.getContent()}</div>
        {reactDom.createPortal(overflow_links, $('#overflow-links')[0])}
      </div>
    )
  }

  getViewButtons() {
    return [
      { type: 'overview', name: gettext('Classroom Overview') },
      { type: 'students', name: gettext('Students') },
      { type: 'assignments', name: gettext('Assignments') },
      { type: 'workflows', name: gettext('Workflow Visibility') },
      { type: 'completion_table', name: gettext('Completion Table') },
      { type: 'settings', name: gettext('Classroom Settings') }
    ]
  }

  getRole() {
    return 'teacher'
  }

  openEdit() {
    return null
  }

  changeView(view_type) {
    this.setState({ view_type: view_type })
  }

  componentDidMount() {}

  getHeader() {
    return null
  }

  getContent() {
    switch (this.state.view_type) {
      case 'overview':
        return (
          <LiveProjectOverview
            renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.props.project.id}
            view_type={this.state.view_type}
          />
        )
      case 'students':
        return (
          <LiveProjectStudents
            renderer={this.props.renderer}
            role={this.getRole()}
            liveproject={this.state.liveproject}
            objectID={this.props.project.id}
            view_type={this.state.view_type}
          />
        )
      case 'assignments':
        return (
          <LiveProjectAssignments
            renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.props.project.id}
            view_type={this.state.view_type}
          />
        )
      case 'workflows':
        return (
          <LiveProjectWorkflows
            renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.props.project.id}
            view_type={this.state.view_type}
          />
        )
      case 'completion_table':
        return (
          <LiveProjectCompletionTable
            renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.props.project.id}
            view_type={this.state.view_type}
          />
        )
      case 'settings':
        return (
          <LiveProjectSettings
            updateLiveProject={this.updateFunction.bind(this)}
            renderer={this.props.renderer}
            role={this.getRole()}
            liveproject={this.state.liveproject}
            objectID={this.props.project.id}
            view_type={this.state.view_type}
          />
        )
    }
  }

  updateFunction(new_state) {
    this.setState(new_state)
  }
}
export class StudentLiveProjectMenu extends LiveProjectMenu {
  getViewButtons() {
    return [
      { type: 'overview', name: gettext('Classroom Overview') },
      { type: 'assignments', name: gettext('My Assignments') },
      { type: 'workflows', name: gettext('My Workflows') }
    ]
  }

  getRole() {
    return 'student'
  }
  getContent() {
    switch (this.state.view_type) {
      case 'overview':
        return (
          <StudentLiveProjectOverview
            renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.props.project.id}
            view_type={this.state.view_type}
          />
        )
      case 'assignments':
        return (
          <StudentLiveProjectAssignments
            renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.props.project.id}
            view_type={this.state.view_type}
          />
        )
      case 'workflows':
        return (
          <StudentLiveProjectWorkflows
            renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.props.project.id}
            view_type={this.state.view_type}
          />
        )
    }
  }

  updateFunction(new_state) {
    this.setState(new_state)
  }
}

export class LiveProjectSection extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  defaultRender() {
    return <renderers.WorkflowLoader />
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
}

export class LiveProjectOverview extends LiveProjectSection {
  render() {
    if (!this.state.data) return this.defaultRender()

    let workflows = this.state.data.workflows.map((workflow) => (
      <SimpleWorkflow workflow_data={workflow} />
    ))
    if (workflows.length == 0)
      workflows = gettext('No workflows have been made visible to students.')
    let teachers = this.state.data.teachers.map((user) => (
      <tr>
        <td class="table-user">{Utility.getUserDisplay(user.user)}</td>
        <td>{user.completion}</td>
      </tr>
    ))
    let students = this.state.data.students.map((user) => (
      <tr>
        <td class="table-user">{Utility.getUserDisplay(user.user)}</td>
        <td>{user.completion}</td>
      </tr>
    ))

    let assignments = this.state.data.assignments.map((assignment) => (
      <tr>
        <td>
          <AssignmentTitle
            data={assignment}
            user_role={this.props.renderer.user_role}
          />
        </td>
        <td>{assignment.completion_info}</td>
        <td>
          <DatePicker default_value={assignment.end_date} disabled={true} />
        </td>
      </tr>
    ))

    return (
      <div class="workflow-details">
        <h3>{gettext('Teachers')}:</h3>
        <table class="overview-table">
          <tr>
            <th>{gettext('User')}</th>
            <th>{gettext('Assignments Complete')}</th>
          </tr>
          {teachers}
        </table>
        <h3>{gettext('Students')}:</h3>
        <table class="overview-table">
          <tr>
            <th>{gettext('User')}</th>
            <th>{gettext('Assignments Complete')}</th>
          </tr>
          {students}
        </table>
        <h3>{gettext('Visible Workflows')}:</h3>
        <div class="menu-grid">{workflows}</div>
        <h3>{gettext('Assignments')}:</h3>
        <table class="overview-table">
          <tr>
            <th>{gettext('Assignment')}</th>
            <th>{gettext('Completion')}</th>
            <th>{gettext('End Date')}</th>
          </tr>
          {assignments}
        </table>
      </div>
    )
  }
}

export class StudentLiveProjectOverview extends LiveProjectSection {
  render() {
    if (!this.state.data) return this.defaultRender()

    let workflows = this.state.data.workflows.map((workflow) => (
      <SimpleWorkflow workflow_data={workflow} />
    ))
    if (workflows.length == 0)
      workflows = gettext('No workflows have been made visible to students.')

    let assignments = this.state.data.assignments
      .filter((assignment) => assignment.user_assignment.completed == false)
      .map((assignment) => (
        <tr>
          <td>
            <AssignmentTitle
              data={assignment}
              user_role={this.props.renderer.user_role}
            />
          </td>
          <td>
            <input
              type="checkbox"
              disabled={!assignment.self_reporting}
              onChange={this.toggleAssignment.bind(
                this,
                assignment.user_assignment.id
              )}
            />
          </td>
          <td>
            <DatePicker default_value={assignment.end_date} disabled={true} />
          </td>
        </tr>
      ))

    return (
      <div class="workflow-details">
        <h3>{gettext('Your Incomplete Assignments')}:</h3>
        <table class="overview-table">
          <tr>
            <th>{gettext('Assignment')}</th>
            <th>{gettext('Completion')}</th>
            <th>{gettext('End Date')}</th>
          </tr>
          {assignments}
        </table>
        <h3>{gettext('Visible Workflows')}:</h3>
        <div class="menu-grid">{workflows}</div>
      </div>
    )
  }

  toggleAssignment(id, evt) {
    setAssignmentCompletion(id, evt.target.checked)
  }
}

export class LiveProjectAssignments extends LiveProjectSection {
  render() {
    if (!this.state.data) return this.defaultRender()
    let assignments = this.state.data.assignments.map((assignment) => (
      <AssignmentView renderer={this.props.renderer} data={assignment} />
    ))
    let workflow_options = this.state.data.workflows.map((workflow) => {
      let view_class = 'hover-shade'
      if (workflow.id == this.state.selected_id) view_class += ' active'
      return (
        <div
          id={'button_' + workflow.id}
          class={view_class}
          onClick={this.changeView.bind(this, workflow.id)}
        >
          <WorkflowTitle no_hyperlink={true} data={workflow} />
        </div>
      )
    })
    let workflow_nodes
    if (this.state.selected_id) {
      workflow_nodes = (
        <AssignmentWorkflowNodesDisplay
          renderer={this.props.renderer}
          objectID={this.state.selected_id}
        />
      )
    }

    return (
      <div class="workflow-details">
        <h3>{gettext('Assigned Tasks')}</h3>
        <div>{assignments}</div>
        <h3>{gettext('All Tasks')}</h3>
        <div id="select-workflow" class="workflow-view-select">
          {workflow_options}
        </div>
        {workflow_nodes}
      </div>
    )
  }

  changeView(workflow_id) {
    this.setState({ selected_id: workflow_id })
  }
}

export class AssignmentWorkflowNodesDisplay extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    if (!this.state.data) return this.defaultRender()
    let weeks = this.state.data.weeks.map((week, i) => {
      let nodes = week.nodes.map((node) => (
        <AssignmentNode renderer={this.props.renderer} data={node} />
      ))
      let default_text
      default_text = week.week_type_display + ' ' + (i + 1)
      return (
        <div class="week">
          <TitleText text={week.title} defaultText={default_text} />
          <div class="node-block-grid">{nodes}</div>
        </div>
      )
    })
    return <div>{weeks}</div>
  }

  componentDidMount() {
    this.getData()
  }

  getData() {
    let component = this
    getWorkflowNodes(this.props.objectID, (data) => {
      component.setState({ data: data.data_package })
    })
  }

  componentDidUpdate(prevProps) {
    if (prevProps.objectID != this.props.objectID) {
      this.setState({ data: null }, this.getData.bind(this))
    }
  }

  defaultRender() {
    return <renderers.WorkflowLoader />
  }
}

export class AssignmentNode extends React.Component {
  render() {
    let data = this.props.data
    let lefticon
    let righticon
    if (data.context_classification > 0)
      lefticon = (
        <img
          title={
            renderer.context_choices.find(
              (obj) => obj.type == data.context_classification
            ).name
          }
          src={
            config.icon_path +
            Constants.context_keys[data.context_classification] +
            '.svg'
          }
        />
      )
    if (data.task_classification > 0)
      righticon = (
        <img
          title={
            renderer.task_choices.find(
              (obj) => obj.type == data.task_classification
            ).name
          }
          src={
            config.icon_path +
            Constants.task_keys[data.task_classification] +
            '.svg'
          }
        />
      )
    let style = { backgroundColor: Utility.getColumnColour(this.props.data) }
    let mouseover_actions = [this.addCreateAssignment(data)]

    return (
      <div style={style} class="node">
        <div class="mouseover-actions">{mouseover_actions}</div>
        <div class="node-top-row">
          <div class="node-icon">{lefticon}</div>
          <NodeTitle data={this.props.data} />
          <div class="node-icon">{righticon}</div>
        </div>
        <div class="node-drop-row"></div>
      </div>
    )
  }

  addCreateAssignment(data) {
    return (
      <ActionButton
        button_icon="assignment.svg"
        button_class="duplicate-self-button"
        titletext={gettext('Create Assignment')}
        handleClick={this.createAssignment.bind(this, data)}
      />
    )
  }

  createAssignment(data) {
    let props = this.props
    props.renderer.tiny_loader.startLoad()
    createAssignment(
      data.id,
      props.renderer.project_data.id,
      (response_data) => {
        props.renderer.tiny_loader.endLoad()
        window.location = config.update_path.liveassignment.replace(
          '0',
          response_data.assignmentPk
        )
      }
    )
  }
}

export class StudentLiveProjectAssignments extends LiveProjectSection {
  render() {
    if (!this.state.data) return this.defaultRender()
    let assignments_past = this.state.data.assignments_past.map(
      (assignment) => (
        <AssignmentView renderer={this.props.renderer} data={assignment} />
      )
    )
    let assignments_upcoming = this.state.data.assignments_upcoming.map(
      (assignment) => (
        <AssignmentView renderer={this.props.renderer} data={assignment} />
      )
    )

    return (
      <div class="workflow-details">
        <h3>{gettext('Your Tasks')}:</h3>
        <h4>{gettext('Upcoming')}:</h4>
        <div>{assignments_upcoming}</div>
        <h4>{gettext('Past')}:</h4>
        <div>{assignments_past}</div>
      </div>
    )
  }
}

export class LiveProjectWorkflows extends LiveProjectSection {
  render() {
    if (!this.state.data) return this.defaultRender()
    let workflows_added = this.state.data.workflows_added.map((workflow) => (
      <WorkflowVisibility
        workflow_data={workflow}
        visibility="visible"
        visibilityFunction={this.switchVisibility.bind(this)}
      />
    ))
    let workflows_not_added = this.state.data.workflows_not_added.map(
      (workflow) => (
        <WorkflowVisibility
          workflow_data={workflow}
          visibility="not_visible"
          visibilityFunction={this.switchVisibility.bind(this)}
        />
      )
    )
    return (
      <div class="workflow-details">
        <h3>{gettext('Visible Workflows')}</h3>
        <div class="menu-grid">{workflows_added}</div>
        <h3>{gettext('Other Workflows')}</h3>
        <div class="menu-grid">{workflows_not_added}</div>
      </div>
    )
  }

  switchVisibility(pk, visibility) {
    let workflows_added = this.state.data.workflows_added.slice()
    let workflows_not_added = this.state.data.workflows_not_added.slice()
    if (visibility == 'visible') {
      for (let i = 0; i < workflows_not_added.length; i++) {
        if (workflows_not_added[i].id == pk) {
          let removed = workflows_not_added.splice(i, 1)
          setWorkflowVisibility(this.props.objectID, pk, true)
          workflows_added.push(removed[0])
        }
      }
    } else {
      for (let i = 0; i < workflows_added.length; i++) {
        if (workflows_added[i].id == pk) {
          let removed = workflows_added.splice(i, 1)
          setWorkflowVisibility(this.props.objectID, pk, false)
          workflows_not_added.push(removed[0])
        }
      }
    }
    this.setState({
      data: {
        ...this.state.data,
        workflows_added: workflows_added,
        workflows_not_added: workflows_not_added
      }
    })
  }
}

export class StudentLiveProjectWorkflows extends LiveProjectSection {
  render() {
    if (!this.state.data) return this.defaultRender()
    let workflows_added = this.state.data.workflows_added.map((workflow) => (
      <WorkflowForMenu workflow_data={workflow} />
    ))
    return (
      <div class="workflow-details">
        <h3>{gettext('Workflows')}</h3>
        <div class="menu-grid">{workflows_added}</div>
      </div>
    )
  }
}

export class LiveProjectStudents extends LiveProjectSection {
  render() {
    if (!this.state.data) return this.defaultRender()
    let liveproject = this.state.data.liveproject

    let register_link
    if (liveproject && liveproject.registration_hash) {
      let register_url = config.registration_path.replace(
        'project_hash',
        liveproject.registration_hash
      )
      register_link = (
        <div class="user-text">
          <div class="user-panel">
            <h4>Student Registration:</h4>
            <p>{gettext('Student Registration Link: ')}</p>
            <div>
              <img
                id="copy-text"
                class="hover-shade"
                onClick={() => {
                  navigator.clipboard.writeText(register_url)
                  $('#copy-text').attr(
                    'src',
                    config.icon_path + 'duplicate_checked.svg'
                  )
                  $('#url-text').text('Copied to Clipboard')
                  setTimeout(() => {
                    $('#copy-text').attr(
                      'src',
                      config.icon_path + 'duplicate_clipboard.svg'
                    )
                    $('#url-text').text(register_url)
                  }, 1000)
                }}
                title={gettext('Copy to clipboard')}
                src={config.icon_path + 'duplicate_clipboard.svg'}
              />
              <a id="url-text" class="selectable" href={register_url}>
                {register_url}
              </a>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div class="workflow-details">
        <StudentManagement data={this.state.data.liveproject} />
        {register_link}
      </div>
    )
  }
}

export class LiveProjectSettings extends LiveProjectSection {
  constructor(props) {
    super(props)
    this.state = { has_changed: false, liveproject: null }
    this.changed_values = {}
  }

  render() {
    if (!this.state.data) return this.defaultRender()
    console.log(this.state)
    let data = this.state.data.liveproject
    let changeField = this.changeField.bind(this)

    return (
      <div class="workflow-details">
        <h4>{gettext('Classroom configuration')}:</h4>
        <div>
          <input
            id="default-single-completion"
            name="default-single-completion"
            type="checkbox"
            checked={data.default_single_completion}
            onChange={(evt) =>
              changeField('default_single_completion', evt.target.checked)
            }
          />
          <label
            for="default-signle-completion"
            title={gettext(
              'Whether to mark the assignment as complete if any user has completed it.'
            )}
          >
            {gettext(
              'By default, mark assignments as complete when a single user has completed them'
            )}
          </label>
        </div>
        <div>
          <input
            id="default-assign-to-all"
            name="default-assign-to-all"
            type="checkbox"
            checked={data.default_assign_to_all}
            onChange={(evt) =>
              changeField('default_assign_to_all', evt.target.checked)
            }
          />
          <label
            for="default-assign-to-all"
            title={gettext(
              'Whether creating an assignment automatically adds all students to it.'
            )}
          >
            {gettext('Assign new assignments to all students by default')}
          </label>
        </div>
        <div>
          <input
            id="default-self-reporting"
            name="default-self-reporting"
            type="checkbox"
            checked={data.default_self_reporting}
            onChange={(evt) =>
              changeField('default_self_reporting', evt.target.checked)
            }
          />
          <label
            for="default-self-reporting"
            title={gettext(
              'Whether students can mark their own assignments as complete.'
            )}
          >
            {gettext(
              'Let students self-report their assignment completion by default'
            )}
          </label>
        </div>
        <div>
          <input
            id="default-all-workflows-visible"
            name="default-all-workflows-visible"
            type="checkbox"
            checked={data.default_all_workflows_visible}
            onChange={(evt) =>
              changeField('default_all_workflows_visible', evt.target.checked)
            }
          />
          <label
            for="default-all-workflows-visible"
            title={gettext(
              'Whether all workflows in the project will be visible to students by default.'
            )}
          >
            {gettext('All Workflows Visible To Students')}
          </label>
        </div>
        <div>
          <button
            class="primary-button"
            disabled={!this.state.has_changed}
            onClick={this.saveChanges.bind(this)}
          >
            {gettext('Save classroom changes')}
          </button>
        </div>
      </div>
    )
  }

  changeField(type, new_value) {
    let new_state = { ...this.state.data.liveproject }
    new_state[type] = new_value
    this.changed_values[type] = new_value
    this.setState({
      has_changed: true,
      data: { ...this.state.data, liveproject: new_state }
    })
  }

  saveChanges() {
    updateLiveProjectValue(
      this.state.data.liveproject.id,
      'liveproject',
      this.changed_values
    )
    this.props.updateLiveProject({
      liveproject: { ...this.state.data.liveproject, ...this.changed_values }
    })
    this.changed_values = {}
    this.setState({ has_changed: false })
  }
}

export class WorkflowVisibility extends WorkflowForMenu {
  render() {
    var data = this.props.workflow_data
    var css_class =
      'workflow-for-menu workflow-visibility hover-shade ' + data.type
    if (this.props.selected) css_class += ' selected'

    let creation_text = gettext('Created')
    if (data.author && data.author != 'None')
      creation_text += ' ' + gettext('by') + ' ' + data.author
    creation_text += ' ' + data.created_on

    return (
      <div ref={this.maindiv} class={css_class}>
        <div class="workflow-top-row">
          <WorkflowTitle class_name="workflow-title" data={data} />
          {this.getButtons()}
          {this.getTypeIndicator()}
        </div>
        <div class="workflow-created">{creation_text}</div>
        <div
          class="workflow-description"
          dangerouslySetInnerHTML={{ __html: data.description }}
        ></div>
      </div>
    )
  }

  clickAction() {
    return null
  }

  getButtons() {
    return (
      <div class="permission-select">
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
}

export class LiveProjectCompletionTable extends LiveProjectSection {
  render() {
    if (!this.state.data) return this.defaultRender()
    let data = this.state.liveproject
    let head = this.state.data.assignments.map((assignment) => (
      <th class="table-cell nodewrapper">
        <AssignmentViewSmall renderer={this.props.renderer} data={assignment} />
      </th>
    ))
    let assignment_ids = this.state.data.assignments.map(
      (assignment) => assignment.id
    )
    let body = this.state.data.table_rows.map((row, row_index) => (
      <tr class="outcome-row">
        <td class="user-head outcome-head">
          {Utility.getUserDisplay(row.user)}
        </td>
        {assignment_ids.map((id) => {
          let assignment = row.assignments.find(
            (row_element) => row_element.assignment == id
          )
          if (!assignment) return <td class="table-cell"></td>
          return (
            <td class="table-cell">
              <input
                onChange={this.toggleCompletion.bind(
                  this,
                  assignment.id,
                  row_index
                )}
                type="checkbox"
                checked={assignment.completed}
              />
            </td>
          )
        })}
        <td class="table-cell total-cell grand-total-cell">
          {row.assignments.reduce(
            (total, assignment) => total + assignment.completed,
            0
          ) +
            '/' +
            row.assignments.length}
        </td>
      </tr>
    ))

    return (
      <div class="workflow-details">
        <h3>{gettext('Table')}:</h3>
        <table class="user-table outcome-table node-rows">
          <tr class="outcome-row node-row">
            <th class="user-head outcome-head empty"></th>
            {head}
            <th class="table-cell nodewrapper total-cell grand-total-cell">
              <div class="total-header">{gettext('Total')}:</div>
            </th>
          </tr>
          {body}
        </table>
      </div>
    )
  }

  toggleCompletion(id, row_index, evt) {
    setAssignmentCompletion(id, evt.target.checked)
    let new_data = { ...this.state.data }
    new_data.table_rows = new_data.table_rows.slice()
    new_data.table_rows[row_index] = { ...new_data.table_rows[row_index] }
    new_data.table_rows[row_index].assignments =
      new_data.table_rows[row_index].assignments.slice()
    let index = new_data.table_rows[row_index].assignments.findIndex(
      (assignment) => assignment.id == id
    )
    new_data.table_rows[row_index].assignments[index] = {
      ...new_data.table_rows[row_index].assignments[index],
      completed: evt.target.checked
    }
    this.setState({ data: new_data })
  }
}
