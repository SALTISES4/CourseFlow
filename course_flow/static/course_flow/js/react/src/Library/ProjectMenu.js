import * as React from 'react'
import * as reactDom from 'react-dom'
import * as Constants from '../Constants.js'
import * as LiveProjectViews from '../Components/Views/LiveProjectView.js'
import {
  deleteSelf,
  duplicateBaseItem,
  getUsersForObject,
  getWorkflowsForProject,
  makeProjectLive,
  restoreSelf
} from '../PostFunctions.js'
import {
  closeMessageBox,
  renderMessageBox
} from '../Components/components/MenuComponents.js'
import {
  CollapsibleText,
  WorkflowTitle
} from '../Components/components/CommonComponents.js'
import * as Utility from '../UtilityFunctions.js'
import LibraryMenu from './LibraryMenu.js'
import WorkflowFilter from './WorkFlowFilter.js'

/*******************************************************
 * The project library menu
 *
 * On mount, this will fetch the workflows for the project. When they have been
 * retrieved it will display them in a workflowfilter.
 *******************************************************/
class ProjectMenu extends LibraryMenu {
  constructor(props) {
    super(props)
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
    makeDropdown($(this.createDiv.current))
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getViewButtons() {
    return [
      { type: 'workflows', name: gettext('Workflows') },
      { type: 'overview', name: gettext('Classroom Overview') },
      { type: 'students', name: gettext('Students') },
      { type: 'assignments', name: gettext('Assignments') },
      { type: 'completion_table', name: gettext('Completion Table') }
      // {type:"settings",name:gettext("Classroom Settings")},
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
          <LiveProjectViews.LiveProjectOverview
            renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.state.data.id}
            view_type={this.state.view_type}
          />
        )
        break
      case 'students':
        return_val.push(
          <LiveProjectViews.LiveProjectStudents
            renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.state.data.id}
            view_type={this.state.view_type}
          />
        )
        break
      case 'assignments':
        return_val.push(
          <LiveProjectViews.LiveProjectAssignments
            renderer={this.props.renderer}
            role={this.getRole()}
            objectID={this.state.data.id}
            view_type={this.state.view_type}
          />
        )
        break
      case 'completion_table':
        return_val.push(
          <LiveProjectViews.LiveProjectCompletionTable
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
    if (data.author_id === user_id) {
      if (data.liveproject) {
        liveproject = (
          <a
            id="live-project"
            className="hover-shade"
            href={config.update_path.liveproject.replace('0', data.id)}
          >
            {gettext('View Classroom')}
          </a>
        )
      } else {
        liveproject = (
          <a
            id="live-project"
            className="hover-shade"
            onClick={this.makeLive.bind(this)}
          >
            {gettext('Create Classroom')}
          </a>
        )
      }
    }

    let overflow_links = [liveproject]
    overflow_links.push(
      <a id="comparison-view" className="hover-shade" href="comparison">
        {gettext('Workflow comparison tool')}
      </a>
    )
    overflow_links.push(<hr />)
    overflow_links.push(this.getExportButton())
    overflow_links.push(this.getCopyButton())
    if (data.author_id === user_id) {
      overflow_links.push(<hr />)
      overflow_links.push(this.getDeleteProject())
    }
    return overflow_links
  }

  getDeleteProject() {
    if (!this.state.data.deleted) {
      return (
        <div className="hover-shade" onClick={this.deleteProject.bind(this)}>
          <div>{gettext('Archive project')}</div>
        </div>
      )
    }
    return [
      <div className="hover-shade" onClick={this.restoreProject.bind(this)}>
        <div>{gettext('Restore project')}</div>
      </div>,
      <div className="hover-shade" onClick={this.deleteProjectHard.bind(this)}>
        <div>{gettext('Permanently delete project')}</div>
      </div>
    ]
  }

  deleteProject() {
    if (
      window.confirm(gettext('Are you sure you want to delete this project?'))
    ) {
      deleteSelf(this.props.data.id, 'project', true, () => {
        this.setState({ data: { ...this.props.data, deleted: true } })
      })
    }
  }

  deleteProjectHard() {
    if (
      window.confirm(
        gettext('Are you sure you want to permanently delete this project?')
      )
    ) {
      deleteSelf(this.props.data.id, 'project', false, () => {
        window.location = config.home_path
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
        gettext(
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
    if (user_id) {
      return (
        <div
          id="export-button"
          className="hover-shade"
          onClick={() =>
            renderMessageBox(this.state.data, 'export', closeMessageBox)
          }
        >
          <div>{gettext('Export')}</div>
        </div>
      )
    }
    return null
  }

  getCopyButton() {
    if (user_id) {
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
                window.location = config.update_path[
                  response_data.new_item.type
                ].replace('0', response_data.new_item.id)
              }
            )
          }}
        >
          <div>{gettext('Copy to my library')}</div>
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
            <h4>{gettext('Permissions')}</h4>
            {this.getUsers()}
          </div>
          <div className="project-other">
            <div className="project-info-section project-description">
              <h4>{gettext('Description')}</h4>
              <CollapsibleText
                text={data.description}
                defaultText={gettext('No description')}
              />
            </div>
            <div className="project-info-section project-disciplines">
              <h4>{gettext('Disciplines')}</h4>
              {this.props.renderer.all_disciplines
                .filter(
                  (discipline) => data.disciplines.indexOf(discipline.id) >= 0
                )
                .map((discipline) => discipline.title)
                .join(', ') || gettext('None')}
            </div>
          </div>
        </div>
      </div>
    )
  }

  getUsers() {
    if (!this.state.users) return null
    let author = this.state.users.author
    let editors = this.state.users.editors
    let commenters = this.state.users.commentors
    let viewers = this.state.users.viewers
    if (!author) return null
    let users_group = []
    if (this.state.users.published) {
      users_group.push(
        <div className="user-name">
          {Utility.getUserTag('view')}
          <span className="material-symbols-rounded">public</span>{' '}
          {gettext('All CourseFlow')}
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
          +{users_group.length - 4} {gettext('more')}
        </div>
      )
    }
    if (!this.props.renderer.read_only)
      users.push(
        <div
          className="user-name collapsed-text-show-more"
          onClick={this.openShareMenu.bind(this)}
        >
          {gettext('Modify')}
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
          title={gettext('Edit Project')}
          onClick={this.openEditMenu.bind(this)}
        >
          <span className="material-symbols-rounded filled">edit</span>
        </div>
      )
    }
    return null
  }

  openEditMenu() {
    renderMessageBox(
      {
        ...this.state.data,
        all_disciplines: this.props.renderer.all_disciplines,
        renderer: this.props.renderer
      },
      'project_edit_menu',
      this.updateFunction.bind(this)
    )
  }

  getCreate() {
    if (!this.props.renderer.read_only) {
      return (
        <div
          className="hover-shade"
          id="create-project-button"
          title={gettext('Create workflow')}
          ref={this.createDiv}
        >
          <span className="material-symbols-rounded filled">add_circle</span>
          <div id="create-links-project" className="create-dropdown">
            <a
              id="activity-create-project"
              href={create_path_this_project.activity}
              className="hover-shade"
            >
              {gettext('New activity')}
            </a>
            <a
              id="course-create-project"
              href={create_path_this_project.course}
              className="hover-shade"
            >
              {gettext('New course')}
            </a>
            <a
              id="program-create-project"
              href={create_path_this_project.program}
              className="hover-shade"
            >
              {gettext('New program')}
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
          title={gettext('Sharing')}
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
    renderMessageBox(data, 'share_menu', () => {
      closeMessageBox()
      component.getUserData()
    })
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
    return (
      <div className="project-menu">
        {this.getHeader()}
        {this.getContent()}
        {reactDom.createPortal(
          this.getOverflowLinks(),
          document.getElementById('overflow-links')
        )}
        {reactDom.createPortal(
          this.getEdit(),
          document.getElementById('visible-icons')
        )}
        {reactDom.createPortal(
          this.getCreate(),
          document.getElementById('visible-icons')
        )}
        {reactDom.createPortal(
          this.getShare(),
          document.getElementById('visible-icons')
        )}
      </div>
    )
  }
}

export default ProjectMenu
