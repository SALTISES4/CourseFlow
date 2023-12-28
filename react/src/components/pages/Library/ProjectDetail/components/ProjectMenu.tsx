import * as React from 'react'
import * as Constants from '@cfConstants'
import {
  deleteSelfQuery,
  makeProjectLiveQuery,
  restoreSelfQuery
} from '@XMLHTTP/PostFunctions'
// @local
import { MenuBar } from '@cfCommonComponents/components'
import LiveProjectOverview from '@cfViews/LiveProjectView/LiveProjectOverview'
import LiveProjectStudents from '@cfViews/LiveProjectView/LiveProjectStudents'
import {
  LiveProjectAssignments,
  LiveProjectCompletionTable
} from '@cfViews/LiveProjectView'
import WorkflowFilter from '@cfCommonComponents/workflow/filters/WorkflowFilter'
import {
  duplicateBaseItemQuery,
  getUsersForObjectQuery,
  getWorkflowsForProjectQuery
} from '@XMLHTTP/APIFunctions'
import {
  ProjectData,
  ProjectMenuProps
} from '@cfPages/Library/ProjectDetail/types'
import { Discipline, Workflow } from '@cfModule/types/common'
import { UsersForObjectQueryResp } from '@XMLHTTP/types'
import { Dialog, DialogTitle } from '@mui/material'
import Header from '@cfPages/Library/ProjectDetail/components/Header'
import ProjectEditDialog from '@cfCommonComponents/dialog/ProjectEditDialog'
import ShareMenu from '@cfCommonComponents/dialog/ShareMenu'
import ExportMenu from '@cfCommonComponents/dialog/ExportMenu'

/*******************************************************
 * The project library menu
 *
 * On mount, this will fetch the workflows for the project. When they have been
 * retrieved it will display them in a workflowfilter.
 *******************************************************/
type StateType = {
  data?: ProjectData
  view_type?: string
  users?: UsersForObjectQueryResp
  workflow_data?: Workflow[]
  openEditDialog?: boolean
  openShareDialog?: boolean
  openExportDialog?: boolean
}

class ProjectMenu extends React.Component<ProjectMenuProps, StateType> {
  private readonly readOnly: boolean
  private readonly userId: number
  private readonly createDiv: React.RefObject<HTMLDivElement>
  private projectPaths: {
    activity: string
    course: string
    program: string
  }
  private readonly userRole: number
  private readonly allDisciplines: Discipline[]
  private readonly viewButtons: { name: string; type: string }[]
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

    // this.renderer = this.props.renderer
    this.data = this.props.data

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

  /*******************************************************
   * ACTION HANDLERS
   *******************************************************/
  deleteProject() {
    if (
      window.confirm(
        window.gettext('Are you sure you want to delete this project?')
      )
    ) {
      deleteSelfQuery(this.data.id, 'project', true, () => {
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
      deleteSelfQuery(this.data.id, 'project', false, () => {
        window.location.href = COURSEFLOW_APP.config.home_path
      })
    }
  }

  restoreProject() {
    restoreSelfQuery(this.data.id, 'project', () => {
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
      makeProjectLiveQuery(this.data.id, (data) => {
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
  Share = () => {
    if (!this.readOnly)
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

  DeleteProject = () => {
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

  ExportButton = () => {
    if (this.userId) {
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
    if (this.userId) {
      return (
        <div
          id="copy-button"
          className="hover-shade"
          onClick={() => {
            const loader = COURSEFLOW_APP.tinyLoader
            loader.startLoad()
            duplicateBaseItemQuery(
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

  OverflowLinks = (data, userId) => {
    let liveproject
    const overflow_links = []

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

    overflow_links.push(liveproject)
    overflow_links.push(
      <a id="comparison-view" className="hover-shade" href="comparison">
        {window.gettext('Workflow comparison tool')}
      </a>
    )
    overflow_links.push(<hr />)
    overflow_links.push(<this.ExportButton />)
    overflow_links.push(<this.CopyButton />)
    if (data.author_id === userId) {
      overflow_links.push(<hr />)
      overflow_links.push(<this.DeleteProject />)
    }
    return overflow_links
  }

  Edit = () => {
    if (!this.readOnly) {
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

  Content = () => {
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
            user_role={this.userRole}
            read_only={this.readOnly}
            project_data={this.state.data}
            workflows={this.state.workflow_data}
            updateWorkflow={this.updateWorkflow.bind(this)}
            context="project"
          />
        )
    }
    return return_val
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
    if (new_data.liveproject) {
      console.log('liveproject updated')
    } else {
      this.setState({
        ...this.state,
        data: {
          ...this.state.data,
          ...new_data
        },
        openEditDialog: false
      })
    }
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
            all_disciplines: this.allDisciplines,
            user_role: this.userRole
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
    const visible_buttons = [<this.Edit />, <this.Create />, <this.Share />]

    return (
      <div className="main-block">
        <MenuBar
          overflow_links={
            <this.OverflowLinks data={this.state.data} userId={this.userId} />
          }
          visible_buttons={visible_buttons}
        />

        <div className="project-menu">
          <Header
            disciplines={this.state.data.disciplines}
            description={this.state.data.description}
            allDisciplines={this.allDisciplines}
            data={this.state.data} // @todo this needs to be unpacked
            users={this.state.users}
            openShareDialog={() => this.openShareDialog()}
            readOnly={this.readOnly}
          />
          <this.Content />
        </div>
        <this.EditDialog />
        <this.ShareDialog />
        <this.ExportDialog />
      </div>
    )
  }
}

export default ProjectMenu
