import * as React from 'react'
import * as Constants from '@cfConstants'
import {
  deleteSelf,
  duplicateBaseItem,
  getUsersForObject,
  getWorkflowsForProject,
  makeProjectLive,
  restoreSelf
} from '@XMLHTTP/PostFunctions.js'
// @local
import LibraryMenu from '../../Library/components/LibraryMenu.js'
import * as Utility from '@cfUtility'
import { CollapsibleText, WorkflowTitle } from '@cfUIComponents'
import { MenuBar } from '@cfCommonComponents'
import LiveProjectOverview from '@cfViews/LiveProjectView/LiveProjectOverview'
import LiveProjectStudents from '@cfViews/LiveProjectView/LiveProjectStudents.js'
import {
  LiveProjectAssignments,
  LiveProjectCompletionTable
} from '@cfViews/LiveProjectView/index.js'
import WorkflowFilter from '@cfComponents/Workflow/WorkflowFilter'
// import { renderMessageBox } from '../components/MenuComponents/MenuComponents.js'
// import closeMessageBox from '../components/MenuComponents/components/closeMessageBox.js'

/*******************************************************
 * The project library menu
 *
 * On mount, this will fetch the workflows for the project. When they have been
 * retrieved it will display them in a workflowfilter.
 *******************************************************/
class ProjectMenu extends LibraryMenu {
  constructor(props) {
    super(props)
    this.user_id = props.userId
    this.state = {
      data: props.data,
      view_type: 'workflows'
    }
  }

  /*******************************************************
   * LIFECYCLE HOOKS
   *******************************************************/
  componentDidMount() {
    let component = this
    getWorkflowsForProject(this.props.data.id, (data) => {
      component.setState({ workflow_data: data.data_package })
    })
    this.getUserData()
    COURSEFLOW_APP.makeDropdown($(this.createDiv.current))
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getViewButtons() {
    return [
      { type: 'workflows', name: window.gettext('Workflows') },
      { type: 'overview', name: window.gettext('Classroom Overview') },
      { type: 'students', name: window.gettext('Students') },
      { type: 'assignments', name: window.gettext('Assignments') },
      { type: 'completion_table', name: window.gettext('Completion Table') }
    ]
  }

  getContent() {
    let return_val = []

    if (
      this.state.data.liveproject &&
      this.props.renderer.user_role === Constants.role_keys.teacher
    )
      return_val.push(
        <div className="workflow-view-select hide-print">
          {this.getViewButtons().map((item) => {
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
            renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.state.data.id}
            view_type={this.state.view_type}
          />
        )
        break
      case 'students':
        return_val.push(
          <LiveProjectStudents
            renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.state.data.id}
            view_type={this.state.view_type}
          />
        )
        break
      case 'assignments':
        return_val.push(
          <LiveProjectAssignments
            renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.state.data.id}
            view_type={this.state.view_type}
          />
        )
        break
      case 'completion_table':
        return_val.push(
          <LiveProjectCompletionTable
            renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.props.data.id}
            view_type={this.state.view_type}
          />
        )
        break
      default:
        return_val.push(
          <WorkflowFilter
            renderer={this.props.renderer}
            workflows={this.state.workflow_data}
            updateWorkflow={this.updateWorkflow.bind(this)}
            context="project"
          />
        )
    }
    return return_val
  }

  changeView(view_type) {
    this.setState({ view_type: view_type })
  }

  // @todo, candidate to remove
  getRole() {
    return 'teacher'
  }

  getOverflowLinks() {
    let data = this.state.data
    let liveproject
    if (data.author_id === this.userId) {
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

    let overflow_links = [liveproject]
    overflow_links.push(
      <a id="comparison-view" className="hover-shade" href="comparison">
        {window.gettext('Workflow comparison tool')}
      </a>
    )
    overflow_links.push(<hr />)
    overflow_links.push(this.getExportButton())
    overflow_links.push(this.getCopyButton())
    if (data.author_id === this.user_id) {
      overflow_links.push(<hr />)
      overflow_links.push(this.getDeleteProject())
    }
    return overflow_links
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

  deleteProject() {
    if (
      window.confirm(
        window.gettext('Are you sure you want to delete this project?')
      )
    ) {
      deleteSelf(this.props.data.id, 'project', true, () => {
        this.setState({ data: { ...this.props.data, deleted: true } })
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
      deleteSelf(this.props.data.id, 'project', false, () => {
        window.location = COURSEFLOW_APP.config.home_path
      })
    }
  }

  restoreProject() {
    restoreSelf(this.props.data.id, 'project', () => {
      this.setState({ data: { ...this.props.data, deleted: false } })
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
      makeProjectLive(this.props.data.id, (data) => {
        location.reload()
      })
    }
  }

  getExportButton() {
    if (this.user_id) {
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
    if (this.user_id) {
      return (
        <div
          id="copy-button"
          className="hover-shade"
          onClick={() => {
            let loader = this.props.renderer.tiny_loader
            loader.startLoad()
            duplicateBaseItem(
              this.props.data.id,
              this.props.data.type,
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

  getUserData() {
    getUsersForObject(this.props.data.id, this.props.data.type, (data) => {
      this.setState({ users: data })
    })
  }

  getHeader() {
    let data = this.state.data
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
              {this.props.renderer.all_disciplines
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

  // @todo needs work
  getUsers() {
    if (!this.state.users) return null

    let author = this.state.users.author
    let editors = this.state.users.editors
    let commenters = this.state.users.commentors
    let viewers = this.state.users.viewers
    let users_group = []

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
      commenters.map((user) => (
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
    let users = [<div className="users-group">{users_group}</div>]
    if (users_group.length > 4) {
      users.push(
        <div className="workflow-created">
          +{users_group.length - 4} {window.gettext('more')}
        </div>
      )
    }
    if (!this.props.renderer.read_only)
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
    if (!this.props.renderer.read_only) {
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

  getCreate() {
    if (!this.props.renderer.read_only) {
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
              href={create_path_this_project.activity}
              className="hover-shade"
            >
              {window.gettext('New activity')}
            </a>
            <a
              id="course-create-project"
              href={create_path_this_project.course}
              className="hover-shade"
            >
              {window.gettext('New course')}
            </a>
            <a
              id="program-create-project"
              href={create_path_this_project.program}
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

  updateFunction(new_data) {
    if (new_data.liveproject) {
      console.log('liveproject updated')
    } else {
      let new_state = { ...this.state }
      new_state.data = { ...new_state.data, ...new_data }
      this.setState(new_state)
    }
  }

  getShare() {
    let share
    if (!this.props.renderer.read_only)
      share = (
        <div
          className="hover-shade"
          id="share-button"
          title={window.gettext('Sharing')}
          onClick={this.openShareMenu.bind(this)}
        >
          <span className="material-symbols-rounded filled">person_add</span>
        </div>
      )
    return share
  }

  openShareMenu() {
    let component = this
    let data = this.state.data
    /*    renderMessageBox(data, 'share_menu', () => {
      closeMessageBox()
      component.getUserData()
    }) */
  }

  updateWorkflow(id, new_values) {
    for (let i = 0; i < this.state.workflow_data.length; i++) {
      if (this.state.workflow_data[i].id === id) {
        let new_state = { ...this.state }
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

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    let visible_buttons = (() => [
      this.getEdit(),
      this.getCreate(),
      this.getShare()
    ]).bind(this)
    let overflow_links = this.getOverflowLinks.bind(this)

    return (
      <div className="main-block">
        <MenuBar
          overflow_links={overflow_links}
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
