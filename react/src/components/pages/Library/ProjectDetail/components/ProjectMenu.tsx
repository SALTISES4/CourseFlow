import * as React from 'react'
import * as Constants from '@cfConstants'
// @local
import WorkflowFilter from '@cfCommonComponents/workflow/filters/WorkflowFilter'
import { ProjectMenuProps } from '@cfPages/Library/ProjectDetail/types'
import { Workflow } from '@cfModule/types/common'
import { UsersForObjectQueryResp } from '@XMLHTTP/types/query'
import { Dialog, DialogTitle } from '@mui/material'
import Header from '@cfPages/Library/ProjectDetail/components/Header'
import ProjectEditDialog from '@cfCommonComponents/dialog/ProjectEditDialog'
import ShareMenu from '@cfCommonComponents/dialog/ShareMenu'
import ExportMenu from '@cfCommonComponents/dialog/ExportMenu'
import MenuBar from '@cfCommonComponents/components/MenuBar'
import { duplicateBaseItemQuery } from '@XMLHTTP/API/global'
import { makeProjectLiveQuery } from '@XMLHTTP/API/project'
import { deleteSelfQuery, restoreSelfQuery } from '@XMLHTTP/API/self'
import { getUsersForObjectQuery } from '@XMLHTTP/API/user'
import { getWorkflowsForProjectQuery } from '@XMLHTTP/API/workflow'
import { Project } from '@cfPages/Workflow/Workflow/types'
// import $ from 'jquery'

/*******************************************************
 * The project library menu
 *
 * On mount, this will fetch the workflows for the project. When they have been
 * retrieved it will display them in a workflowfilter.
 *******************************************************/
interface StateType {
  data?: Project
  view_type?: string
  users?: UsersForObjectQueryResp
  workflow_data?: Workflow[]
  openEditDialog?: boolean
  openShareDialog?: boolean
  openExportDialog?: boolean
}

class ProjectMenu extends React.Component<ProjectMenuProps, StateType> {
  private readonly createDiv: React.RefObject<HTMLDivElement>
  private readonly viewButtons: { name: string; type: string }[]

  constructor(props: ProjectMenuProps) {
    super(props)
    this.viewButtons = [
      { type: 'workflows', name: window.gettext('Workflows') },
      { type: 'overview', name: window.gettext('Classroom Overview') },
      { type: 'students', name: window.gettext('Students') },
      { type: 'assignments', name: window.gettext('Assignments') },
      { type: 'completion_table', name: window.gettext('Completion Table') }
    ]

    // this.renderer = this.props.renderer

    this.state = {
      data: this.props.data,
      view_type: 'workflows',
      users: null,
      workflow_data: [],
      openEditDialog: false,
      openShareDialog: false,
      openExportDialog: false
    }

    this.createDiv = React.createRef()
  }

  /*******************************************************
   * LIFECYCLE HOOKS
   *******************************************************/
  componentDidMount() {
    const component = this
    getWorkflowsForProjectQuery(this.props.data.id, (data) => {
      component.setState({
        workflow_data: data.data_package
      })
    })
    this.getUserData()
    COURSEFLOW_APP.makeDropdown($(this.createDiv.current))
  }

  // @todo this is wrapped because it is called by openShareMenu
  // so do not unwrap until the renderMessageBox is sorted out
  getUserData() {
    getUsersForObjectQuery(this.props.data.id, this.props.data.type, (data) => {
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

  /*******************************************************
   * ACTION HANDLERS
   *******************************************************/
  deleteProject() {
    if (
      window.confirm(
        window.gettext('Are you sure you want to delete this project?')
      )
    ) {
      deleteSelfQuery(this.props.data.id, 'project', true, () => {
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
      deleteSelfQuery(this.props.data.id, 'project', false, () => {
        window.location.href = COURSEFLOW_APP.config.home_path
      })
    }
  }

  restoreProject() {
    restoreSelfQuery(this.props.data.id, 'project', () => {
      this.setState({ data: { ...this.props.data, deleted: false } })
    })
  }

  //@todo can this be removed now?
  makeLive() {
    if (
      window.confirm(
        window.gettext(
          'Are you sure you want to create a live classroom for this project?'
        )
      )
    ) {
      makeProjectLiveQuery(this.props.data.id, (data) => {
        location.reload()
      })
    }
  }

  /*******************************************************
   * MODAL HANDLERS
   *******************************************************/

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

  /*******************************************************
   * COMPONENTS
   *******************************************************/

  /*******************************************************
   * OVERFLOW LINKS
   *******************************************************/
  DeleteProjectButton = () => {
    if (!this.state.data.deleted) {
      return (
        <div className="hover-shade" onClick={this.deleteProject.bind(this)}>
          <div>{window.gettext('Archive project')}</div>
        </div>
      )
    }
    return (
      <>
        <div className="hover-shade" onClick={this.restoreProject.bind(this)}>
          <div>{window.gettext('Restore project')}</div>
        </div>
        <div
          className="hover-shade"
          onClick={this.deleteProjectHard.bind(this)}
        >
          <div>{window.gettext('Permanently delete project')}</div>
        </div>
      </>
    )
  }

  ExportButton = () => {
    if (this.props.userId) {
      return (
        <div
          id="export-button"
          className="hover-shade"
          onClick={() => {
            this.openExportDialog.bind(this)
          }}
        >
          <div>{window.gettext('Export')}</div>
        </div>
      )
    }
    return null
  }

  CopyButton = () => {
    if (this.props.userId) {
      return (
        <div
          id="copy-button"
          className="hover-shade"
          onClick={() => {
            const loader = COURSEFLOW_APP.tinyLoader
            loader.startLoad()
            duplicateBaseItemQuery(
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

  OverflowLinks = () => {
    const data = this.state.data

    const overflow_links = []

    overflow_links.push(
      <a id="comparison-view" className="hover-shade" href="comparison">
        {window.gettext('Workflow comparison tool')}
      </a>
    )
    overflow_links.push(<hr />)
    overflow_links.push(<this.ExportButton />)
    overflow_links.push(<this.CopyButton />)
    if (data.author_id === this.props.userId) {
      overflow_links.push(<hr />)
      overflow_links.push(<this.DeleteProjectButton />)
    }
    return overflow_links
  }

  /*******************************************************
   * VISIBLE BUTTONS
   *******************************************************/
  Edit = () => {
    if (!this.props.readOnly) {
      return (
        <div
          className="hover-shade"
          id="edit-project-button"
          title={window.gettext('Edit Project')}
          onClick={this.openEditDialog.bind(this)}
        >
          <span className="material-symbols-rounded filled">edit</span>
        </div>
      )
    }
    return null
  }

  Create = () => {
    if (!this.props.readOnly) {
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
              href={this.props.projectPaths.activity}
              className="hover-shade"
            >
              {window.gettext('New activity')}
            </a>
            <a
              id="course-create-project"
              href={this.props.projectPaths.course}
              className="hover-shade"
            >
              {window.gettext('New course')}
            </a>
            <a
              id="program-create-project"
              href={this.props.projectPaths.program}
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

  Share = () => {
    if (!this.props.readOnly)
      return (
        <div
          className="hover-shade"
          id="share-button"
          title={window.gettext('Sharing')}
          onClick={this.openShareDialog.bind(this)}
        >
          <span className="material-symbols-rounded filled">person_add</span>
        </div>
      )
    return null
  }

  VisibleButtons = () => {
    return (
      <>
        <this.Edit />
        <this.Create />
        <this.Share />
      </>
    )
  }
  /*******************************************************
   *
   *******************************************************/
  Content = () => {
    return (
      <WorkflowFilter
        read_only={this.props.readOnly}
        project_data={this.state.data}
        workflows={this.state.workflow_data}
        updateWorkflow={this.updateWorkflow.bind(this)}
        context="project"
      />
    )
  }

  /*******************************************************
   * MODALS
   *******************************************************/

  openEditDialog() {
    this.setState({
      ...this.state,
      openEditDialog: true
    })
  }

  openShareDialog() {
    this.setState({
      ...this.state,
      openShareDialog: true
    })
  }

  openExportDialog() {
    this.setState({
      ...this.state,
      openExportDialog: true
    })
  }

  closeModals() {
    this.setState({
      ...this.state,
      openExportDialog: false,
      openShareDialog: false,
      openEditDialog: false
    })
  }

  updateFunction(new_data) {
    this.setState({
      ...this.state,
      data: {
        ...this.state.data,
        ...new_data
      },
      openEditDialog: false
    })
  }

  ShareDialog = () => {
    return (
      <Dialog open={this.state.openShareDialog}>
        <DialogTitle>
          <h2>{window.gettext('Share project')}</h2>
        </DialogTitle>
        <ShareMenu
          data={this.state.data}
          actionFunction={() => {
            this.setState({
              ...this.state,
              openShareDialog: false
            })
            this.getUserData()
          }}
        />
      </Dialog>
    )
  }

  EditDialog = () => {
    return (
      <Dialog open={this.state.openEditDialog}>
        <ProjectEditDialog
          type={'project_edit_menu'}
          data={{
            ...this.state.data,
            all_disciplines: this.props.allDisciplines
            // renderer: this.props.renderer
          }}
          actionFunction={this.updateFunction}
          closeAction={() => this.closeModals()}
        />
      </Dialog>
    )
  }

  ExportDialog = () => {
    return (
      <Dialog open={this.state.openExportDialog}>
        <DialogTitle>
          <h2>{window.gettext('Export project')}</h2>
        </DialogTitle>
        <ExportMenu data={this.state.data} actionFunction={this.closeModals} />
      </Dialog>
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    return (
      <>
        <div className="main-block">
          <MenuBar
            overflowLinks={() => <this.OverflowLinks />}
            visibleButtons={() => <this.VisibleButtons />}
          />

          <div className="project-menu">
            <Header
              disciplines={this.state.data.disciplines}
              description={this.state.data.description}
              allDisciplines={this.props.allDisciplines}
              data={this.state.data} // @todo this needs to be unpacked
              users={this.state.users}
              openShareDialog={() => this.openShareDialog()}
              readOnly={this.props.readOnly}
            />
            <this.Content />
          </div>
          <this.EditDialog />
          <this.ShareDialog />
          <this.ExportDialog />
        </div>
      </>
    )
  }
}

export default ProjectMenu
