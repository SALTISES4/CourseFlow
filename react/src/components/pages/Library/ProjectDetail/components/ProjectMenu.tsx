// @ts-nocheck
import * as React from 'react'
import * as Constants from '@cfConstants'
import {
  deleteSelf,
  duplicateBaseItem,
  makeProjectLive,
  restoreSelf
} from '@XMLHTTP/PostFunctions'
// @local
import * as Utility from '@cfUtility'
import { MenuBar } from '@cfCommonComponents/components'
import LiveProjectOverview from '@cfViews/LiveProjectView/LiveProjectOverview'
import LiveProjectStudents from '@cfViews/LiveProjectView/LiveProjectStudents'
import {
  LiveProjectAssignments,
  LiveProjectCompletionTable
} from '@cfViews/LiveProjectView'
import WorkflowFilter from '@cfCommonComponents/workflow/filters/WorkflowFilter'
import {
  getUsersForObjectQuery,
  getWorkflowsForProjectQuery
} from '@XMLHTTP/APIFunctions'
import {
  Discipline,
  ProjectData,
  ProjectMenuProps,
  ProjectRenderer
} from '@cfPages/Library/ProjectDetail/types'
import { Workflow } from '@cfModule/types/common'
import { CollapsibleText, WorkflowTitle } from '@cfUIComponents/index.js'
import { UsersForObjectQuery } from '@XMLHTTP/types'
// import { renderMessageBox } from '../components/MenuComponents/MenuComponents'
// import closeMessageBox from '../components/MenuComponents/components/closeMessageBox'

/*******************************************************
 * The project library menu
 *
 * On mount, this will fetch the workflows for the project. When they have been
 * retrieved it will display them in a workflowfilter.
 *******************************************************/
type StateType = {
  data?: ProjectData
  view_type?: string
  users?: UsersForObjectQuery
  workflow_data?: Workflow[]
}

class ProjectMenu extends React.Component<ProjectMenuProps, StateType> {
  private readonly readOnly: boolean
  private readonly userId: number
  private readonly createDiv: React.RefObject<HTMLDivElement>
  private readonly renderer: ProjectRenderer
  private projectPaths: {
    activity: string
    course: string
    program: string
  }
  private readonly userRole: number
  private allDisciplines: Discipline[]
  private viewButtons: { name: string; type: string }[]
  private readonly data: ProjectData

  constructor(props: ProjectMenuProps) {
    super(props)
    this.viewButtons = [
      { type: 'workflows', name: window.gettext('Workflows') },
      { type: 'overview', name: window.gettext('Classroom Overview') },
      { type: 'students', name: window.gettext('Students') },
      { type: 'assignments', name: window.gettext('Assignments') },
      { type: 'completion_table', name: window.gettext('Completion Table') }
    ]
    this.userId = this.props.userId
    this.userRole = this.props.userRole
    this.readOnly = this.props.readOnly
    this.projectPaths = this.props.projectPaths
    this.allDisciplines = this.props.allDisciplines

    this.renderer = this.props.renderer
    this.data = this.props.data

    this.state = {
      data: this.props.data,
      view_type: 'workflows',
      users: null,
      workflow_data: []
    }
    this.createDiv = React.createRef()
  }

  /*******************************************************
   * LIFECYCLE HOOKS
   *******************************************************/
  componentDidMount() {
    const component = this
    getWorkflowsForProjectQuery(this.data.id, (data) => {
      component.setState({
        workflow_data: data.data_package
      })
    })
    this.getUserData()
    COURSEFLOW_APP.makeDropdown($(this.createDiv.current))
  }

  // @todo this is wrapped because it is called by openShareMenu
  // so do no unwrap until the renderMessageBox is sorted out
  getUserData() {
    getUsersForObjectQuery(this.data.id, this.data.type, (data) => {
      this.setState({ users: data })
    })
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  changeView(view_type) {
    this.setState({ view_type: view_type })
  }

  // @todo, candidate to remove
  getRole() {
    return 'teacher'
  }

  deleteProject() {
    if (
      window.confirm(
        window.gettext('Are you sure you want to delete this project?')
      )
    ) {
      deleteSelf(this.data.id, 'project', true, () => {
        this.setState({ data: { ...this.data, deleted: true } })
      })
    }
  }

  deleteProjectHard() {
    if (
      window.confirm(
        window.gettext(
          'Are you sure you want to permanently delete this project?'
        )
      )
    ) {
      deleteSelf(this.data.id, 'project', false, () => {
        window.location = COURSEFLOW_APP.config.home_path
      })
    }
  }

  restoreProject() {
    restoreSelf(this.data.id, 'project', () => {
      this.setState({ data: { ...this.data, deleted: false } })
    })
  }

  makeLive() {
    if (
      window.confirm(
        window.gettext(
          'Are you sure you want to create a live classroom for this project?'
        )
      )
    ) {
      makeProjectLive(this.data.id, (data) => {
        location.reload()
      })
    }
  }

  openEditMenu() {
    console.log(
      "openEditMenu in procetmenu.js see function coment for why this doesn't work"
    )
    // @todo the renderMessageBox is causing a circ cep and needs to be refactored
    // renderMessageBox(
    //   {
    //     ...this.state.data,
    //     all_disciplines: this.props.renderer.all_disciplines,
    //     renderer: this.props.renderer
    //   },
    //   'project_edit_menu',
    //   this.updateFunction.bind(this)
    // )
  }

  updateFunction(new_data) {
    if (new_data.liveproject) {
      console.log('liveproject updated')
    } else {
      const new_state = { ...this.state }
      new_state.data = { ...new_state.data, ...new_data }
      this.setState(new_state)
    }
  }

  updateWorkflow(id, new_values) {
    for (let i = 0; i < this.state.workflow_data.length; i++) {
      if (this.state.workflow_data[i].id === id) {
        const new_state = { ...this.state }
        new_state.workflow_data = [...this.state.workflow_data]
        new_state.workflow_data[i] = {
          ...this.state.workflow_data[i],
          ...new_values
        }
        this.setState(new_state)
        break
      }
    }
  }

  openShareMenu() {
    const component = this
    const data = this.state.data
    /*    renderMessageBox(data, 'share_menu', () => {
      closeMessageBox()
      component.getUserData()
    }) */
  }
  /*******************************************************
   * COMPONENTS
   *******************************************************/
  getShare() {
    if (!this.readOnly)
      return (
        <div
          className="hover-shade"
          id="share-button"
          title={window.gettext('Sharing')}
          onClick={this.openShareMenu.bind(this)}
        >
          <span className="material-symbols-rounded filled">person_add</span>
        </div>
      )
    return null
  }

  getDeleteProject() {
    if (!this.state.data.deleted) {
      return (
        <div className="hover-shade" onClick={this.deleteProject.bind(this)}>
          <div>{window.gettext('Archive project')}</div>
        </div>
      )
    }
    return [
      <div className="hover-shade" onClick={this.restoreProject.bind(this)}>
        <div>{window.gettext('Restore project')}</div>
      </div>,
      <div className="hover-shade" onClick={this.deleteProjectHard.bind(this)}>
        <div>{window.gettext('Permanently delete project')}</div>
      </div>
    ]
  }

  OverflowLinks = (data, userId) => {
    let liveproject
    if (data.author_id === userId) {
      if (data.liveproject) {
        liveproject = (
          <a
            id="live-project"
            className="hover-shade"
            href={COURSEFLOW_APP.config.update_path.liveproject.replace(
              '0',
              data.id
            )}
          >
            {window.gettext('View Classroom')}
          </a>
        )
      } else {
        liveproject = (
          <a
            id="live-project"
            className="hover-shade"
            onClick={this.makeLive.bind(this)}
          >
            {window.gettext('Create Classroom')}
          </a>
        )
      }
    }

    const overflow_links = [liveproject]
    overflow_links.push(
      <a id="comparison-view" className="hover-shade" href="comparison">
        {window.gettext('Workflow comparison tool')}
      </a>
    )
    overflow_links.push(<hr />)
    overflow_links.push(this.getExportButton())
    overflow_links.push(this.getCopyButton())
    if (data.author_id === userId) {
      overflow_links.push(<hr />)
      overflow_links.push(this.getDeleteProject())
    }
    return overflow_links
  }

  getExportButton() {
    if (this.userId) {
      return (
        <div
          id="export-button"
          className="hover-shade"
          onClick={() => {
            // @todo the renderMessageBox is causing a circ cep and needs to be refactored
            //   renderMessageBox(this.state.data, 'export', closeMessageBox)
          }}
        >
          <div>{window.gettext('Export')}</div>
        </div>
      )
    }
    return null
  }

  getCopyButton() {
    if (this.userId) {
      return (
        <div
          id="copy-button"
          className="hover-shade"
          onClick={() => {
            const loader = COURSEFLOW_APP.tinyLoader
            loader.startLoad()
            duplicateBaseItem(
              this.data.id,
              this.data.type,
              null,
              (response_data) => {
                loader.endLoad()
                window.location = COURSEFLOW_APP.config.update_path[
                  response_data.new_item.type
                ].replace('0', response_data.new_item.id)
              }
            )
          }}
        >
          <div>{window.gettext('Copy to my library')}</div>
        </div>
      )
    }
    return null
  }

  getUsers() {
    let users_group = []

    if (!this.state.users) return null
    const { author, editors, commentors, viewers } = this.state.users

    if (!author) return null

    if (this.state.users.published) {
      users_group.push(
        <div className="user-name">
          {Utility.getUserTag('view')}
          <span className="material-symbols-rounded">public</span>{' '}
          {window.gettext('All CourseFlow')}
        </div>
      )
    }

    users_group.push([
      <div className="user-name">
        {Utility.getUserTag('author')}
        {Utility.getUserDisplay(author)}
      </div>,
      editors
        .filter((user) => user.id != author.id)
        .map((user) => (
          <div className="user-name">
            {Utility.getUserTag('edit')}
            {Utility.getUserDisplay(user)}
          </div>
        )),
      commentors.map((user) => (
        <div className="user-name">
          {Utility.getUserTag('comment')}
          {Utility.getUserDisplay(user)}
        </div>
      )),
      viewers.map((user) => (
        <div className="user-name">
          {Utility.getUserTag('view')}
          {Utility.getUserDisplay(user)}
        </div>
      ))
    ])
    users_group = users_group.flat(2)
    const users = [<div className="users-group">{users_group}</div>]
    if (users_group.length > 4) {
      users.push(
        <div className="workflow-created">
          +{users_group.length - 4} {window.gettext('more')}
        </div>
      )
    }
    if (!this.readOnly)
      users.push(
        <div
          className="user-name collapsed-text-show-more"
          onClick={this.openShareMenu.bind(this)}
        >
          {window.gettext('Modify')}
        </div>
      )
    return users
  }

  getEdit() {
    if (!this.readOnly) {
      return (
        <div
          className="hover-shade"
          id="edit-project-button"
          title={window.gettext('Edit Project')}
          onClick={this.openEditMenu.bind(this)}
        >
          <span className="material-symbols-rounded filled">edit</span>
        </div>
      )
    }
    return null
  }

  getCreate() {
    if (!this.readOnly) {
      return (
        <div
          className="hover-shade"
          id="create-project-button"
          title={window.gettext('Create workflow')}
          ref={this.createDiv}
        >
          <span className="material-symbols-rounded filled">add_circle</span>
          <div id="create-links-project" className="create-dropdown">
            <a
              id="activity-create-project"
              href={this.projectPaths.activity}
              className="hover-shade"
            >
              {window.gettext('New activity')}
            </a>
            <a
              id="course-create-project"
              href={this.projectPaths.course}
              className="hover-shade"
            >
              {window.gettext('New course')}
            </a>
            <a
              id="program-create-project"
              href={this.projectPaths.program}
              className="hover-shade"
            >
              {window.gettext('New program')}
            </a>
          </div>
        </div>
      )
    }
    return null
  }

  getHeader() {
    const data = this.state.data
    return (
      <div className="project-header">
        <WorkflowTitle
          data={data}
          no_hyperlink={true}
          class_name="project-title"
        />
        <div className="project-header-info">
          <div className="project-info-section project-members">
            <h4>{window.gettext('Permissions')}</h4>
            {this.getUsers()}
          </div>
          <div className="project-other">
            <div className="project-info-section project-description">
              <h4>{window.gettext('Description')}</h4>
              <CollapsibleText
                text={data.description}
                defaultText={window.gettext('No description')}
              />
            </div>
            <div className="project-info-section project-disciplines">
              <h4>{window.gettext('Disciplines')}</h4>
              {this.allDisciplines
                .filter(
                  (discipline) => data.disciplines.indexOf(discipline.id) >= 0
                )
                .map((discipline) => discipline.title)
                .join(', ') || window.gettext('None')}
            </div>
          </div>
        </div>
      </div>
    )
  }

  getContent() {
    const return_val = []

    if (
      this.state.data.liveproject &&
      this.userRole === Constants.role_keys.teacher
    )
      return_val.push(
        <div className="workflow-view-select hide-print">
          {this.viewButtons.map((item) => {
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
          })}
        </div>
      )

    switch (this.state.view_type) {
      // @todo remove view_type
      case 'overview':
        return_val.push(
          <LiveProjectOverview
            userRole={this.userRole}
            role={this.getRole()} // @todo what is differtence between this ad userRole and why is one hardcodcded
            objectID={this.state.data.id}
            view_type={this.state.view_type}
          />
        )
        break
      case 'students':
        return_val.push(
          <LiveProjectStudents
            role={this.getRole()}
            objectID={this.state.data.id}
            view_type={this.state.view_type}
          />
        )
        break
      case 'assignments':
        return_val.push(
          <LiveProjectAssignments
            // renderer={this.renderer} @todo i don't think live projects gets kept, if so address renderer
            role={this.getRole()}
            objectID={this.state.data.id}
            view_type={this.state.view_type}
          />
        )
        break
      case 'completion_table':
        return_val.push(
          <LiveProjectCompletionTable
            // renderer={this.renderer} @todo i don't think live projects gets kept, if so address renderer
            role={this.getRole()}
            objectID={this.data.id}
            view_type={this.state.view_type}
          />
        )
        break
      default:
        return_val.push(
          <WorkflowFilter
            workflows={this.state.workflow_data}
            updateWorkflow={this.updateWorkflow.bind(this)}
            context="project"
          />
        )
    }
    return return_val
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    const visible_buttons = [this.getEdit(), this.getCreate(), this.getShare()]

    return (
      <div className="main-block">
        <MenuBar
          overflow_links={
            <this.OverflowLinks data={this.state.data} userId={this.userId} />
          }
          visible_buttons={visible_buttons}
        />
        <div className="project-menu">
          {this.getHeader()}
          {this.getContent()}
        </div>
      </div>
    )
  }
}

export default ProjectMenu
