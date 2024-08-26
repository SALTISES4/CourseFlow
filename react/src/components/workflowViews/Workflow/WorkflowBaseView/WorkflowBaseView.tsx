import * as React from 'react'
import * as reactDom from 'react-dom'
import { connect, DispatchProp } from 'react-redux'

import RightSideBar from '@cfViews/components/rightSideBarContent/RightSideBar.jsx'
import * as Constants from '@cfConstants'
import * as Utility from '@cfUtility'
import ConnectionBar from '@cfViews/Workflow/WorkflowBaseView/components/ConnectionBar'

import { Dialog, DialogTitle } from '@mui/material'

import WorkflowView from '@cfViews/Workflow/WorkflowView/WorkflowView'
import OutcomeEditView from '@cfViews/Workflow/OutcomeEditView/OutcomeEditView'
import JumpToWeekWorkflow from '@cfViews/Workflow/WorkflowBaseView/JumpToWeekWorkflow'
import ParentWorkflowIndicator from '@cfViews/Workflow/WorkflowBaseView/ParentWorkflowIndicator'
import WorkflowTableView from '@cfViews/Workflow/WorkflowBaseView/WorkflowTableView'
import AlignmentView from '@cfViews/Workflow/AlignmentView/AlignmentView'
import ShareMenu from '@cfCommonComponents/dialog/ShareMenu.jsx'
import ExportMenu from '@cfCommonComponents/dialog/ExportMenu.jsx'
import { WorkflowTitle } from '@cfCommonComponents/UIComponents/Titles'
import CollapsibleText from '@cfCommonComponents/UIComponents/CollapsibleText'
import { AppState } from '@cfRedux/types/type'
import EditableComponent, {
  EditableComponentProps,
  EditableComponentStateType
} from '@cfEditableComponents/EditableComponent'
import { DIALOG_TYPE, useDialog } from '@cfModule/components/common/dialog'
import { CfObjectType, ViewType, WFContext } from '@cfModule/types/enum'
import MenuBar from '@cfCommonComponents/components/MenuBar'
import { duplicateBaseItemQuery } from '@XMLHTTP/API/duplication'
import { getUsersForObjectQuery } from '@XMLHTTP/API/sharing'
import { deleteSelfQuery, restoreSelfQuery } from '@XMLHTTP/API/delete'
import { WorkFlowConfigContext } from '@cfModule/context/workFlowConfigContext'

import GridView from '../GridView/GridView.js'
import { UtilityLoader } from '@cfModule/utility/UtilityLoader'
import { toggleDropReduxAction } from '@cfRedux/utility/helpers'
import { SelectionManager } from '@cfRedux/utility/SelectionManager'
import { EventUnion } from '@cfModule/types/common'
import { DialogContextProvider } from '@cfModule/components/common/dialog/context'
import ProjectTargetModal from '@cfModule/components/common/dialog/ProjectTarget'
import ImportModal from '@cfModule/components/common/dialog/Import'
import ActionCreator from '@cfRedux/ActionCreator'
import { getWorkflowParentDataQuery } from '@XMLHTTP/API/workflow'
import { WorkflowPermission } from '@cfPages/Workspace/Workflow/types'

type ConnectedProps = {
  data: AppState['workflow']
  object_sets: AppState['objectset']
  week: AppState['week']
  node: AppState['node']
  outcome: AppState['outcome']
}

const CopyButton = (data: any) => {
  const { dispatch } = useDialog()

  return (
    <div
      id="copy-button"
      className="hover-shade"
      onClick={() => {
        const loader = COURSEFLOW_APP.tinyLoader
        if (data.is_strategy) {
          duplicateBaseItemQuery(data.id, data.type, null, (response_data) => {
            loader.endLoad()
            // @todo no
            // @ts-ignore
            window.location =
              COURSEFLOW_APP.globalContextData.path.html.update_path_temp.replace(
                '0',
                // @ts-ignore
                response_data.new_item.id
              )
          })
        } else {
          dispatch(DIALOG_TYPE.TARGET_PROJECT)
        }
      }}
    >
      <div>{window.gettext('Copy to my library')}</div>
    </div>
  )
}

const ImportButtons = ({ aClass }: { aClass: string }) => {
  const { dispatch } = useDialog()

  return (
    <>
      <hr />
      <a
        className={aClass}
        onClick={() => dispatch(DIALOG_TYPE.IMPORT_OUTCOMES)}
      >
        {window.gettext('Import Outcomes')}
      </a>
      <a className={aClass} onClick={() => dispatch(DIALOG_TYPE.IMPORT_NODES)}>
        {window.gettext('Import Nodes')}
      </a>
    </>
  )
}

/***
 * @TODO NEED TO CLEAN UP TYPES
 * MAINLY REMOVE RENDERER IN THIS FILE AND
 AMD
 EditableComponent
 AND
 CommentBox
 ComponentWithToggleDrop

 */

type OwnProps = {
  updateView: (viewType: ViewType) => void
  config: {
    isStudent: boolean
    projectPermission: number
    workflowPermission: WorkflowPermission
    alwaysStatic: boolean
  }
} & EditableComponentProps

type PropsType = DispatchProp & ConnectedProps & OwnProps
type StateType = {
  users: any
  openShareDialog: boolean
  openExportDialog: boolean
  openImportDialog: boolean
  openEditDialog: boolean
  data?: any
} & EditableComponentStateType

/**
 * The base component of our workflow view. This renders the menu bar
 * above itself, the right sidebar, the header (description, sharing etc),
 * and then the tabs that allow the user to select a "type" of workflow view.
 */
// @todo was previously extending EditableComponentWithActions
// but as far as i can tell it uses nothing from
// EditableComponentWithActions or EditableComponentWithComments
// with possible exception of addDeleteSelf (which needs addressing independently)
class WorkflowBaseViewUnconnected extends EditableComponent<
  PropsType,
  StateType
> {
  static contextType = WorkFlowConfigContext

  // Constants
  objectType = CfObjectType.WORKFLOW
  private allowed_tabs = [0, 1, 2, 3, 4]

  private readOnly: boolean

  private public_view: any
  private data: ConnectedProps['data']
  private project: any
  private selection_manager: SelectionManager
  private always_static: boolean
  private user_id: any
  private project_permission: number
  private object_sets: any
  private workflowId: number

  constructor(props: PropsType, context) {
    // @ts-ignore
    super(props, context)

    this.data = this.props.data
    this.project = context.project
    this.workflowId = context.workflowID

    this.project_permission = this.props.config.projectPermission
    this.always_static = this.props.config.alwaysStatic

    this.state = {
      users: null,
      openShareDialog: false,
      openExportDialog: false,
      openImportDialog: false
    } as StateType
    this.selection_manager = context.selection_manager

    // this should be a state type, but leave in context for now
    // this.container = this.context.container
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.getUserData()
    this.updateTabs()
    // @ts-ignore
    COURSEFLOW_APP.makeDropdown('#jump-to')
    COURSEFLOW_APP.makeDropdown('#expand-collapse-all')

    if (this.context.viewType === ViewType.OUTCOME_EDIT) {
      getWorkflowParentDataQuery(this.workflowId, (response) => {
        this.props.dispatch(
          ActionCreator.refreshStoreData(response.data_package)
        )
      })
    }
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getUserData() {
    if (this.public_view || this.props.config.isStudent) {
      return null
    }
    getUsersForObjectQuery(this.data.id, this.data.type, (data) => {
      this.setState({ users: data })
    })
  }

  deleteWorkflow() {
    if (
      window.confirm(
        window.gettext('Are you sure you want to delete this workflow?')
      )
    ) {
      deleteSelfQuery(this.data.id, 'workflow', true, () => {})
    }
  }

  deleteWorkflowHard() {
    if (
      window.confirm(
        window.gettext(
          'Are you sure you want to permanently delete this workflow?'
        )
      )
    ) {
      deleteSelfQuery(this.data.id, 'workflow', false, () => {
        // @todo no
        const newPath =
          COURSEFLOW_APP.globalContextData.path.html.update_path_temp.replace(
            '0',
            this.project.id.toString()
          )
        window.location.href = newPath
      })
    }
  }

  restoreWorkflow() {
    restoreSelfQuery(this.data.id, 'workflow', () => {})
  }

  updateTabs() {
    //If the view type has changed, enable only appropriate tabs, and change the selection to none
    this.selection_manager.changeSelection(null, null)
    const disabled_tabs = []

    for (let i = 0; i <= 4; i++) {
      if (this.allowed_tabs.indexOf(i) < 0) {
        disabled_tabs.push(i)
      }
    }

    /*******************************************************
     * JQUERY
     *******************************************************/
    $('#sidebar').tabs({ disabled: false })
    const current_tab = $('#sidebar').tabs('option', 'active')

    if (this.allowed_tabs.indexOf(current_tab) < 0) {
      if (this.allowed_tabs.length == 0) {
        $('#sidebar').tabs({
          active: false
        })
      } else {
        $('#sidebar').tabs({
          active: this.allowed_tabs[0]
        })
      }
    }

    // @todo remove renderer
    if (this.readOnly) {
      disabled_tabs.push(5)
    }
    $('#sidebar').tabs({
      disabled: disabled_tabs
    })
    /*******************************************************
     * // JQUERY
     *******************************************************/
  }

  changeView(type: ViewType) {
    this.props.updateView(type)
  }

  openEditMenu(evt: EventUnion) {
    this.selection_manager.changeSelection(evt, this)
  }

  // clickImport(import_type, evt) {
  //   evt.preventDefault()
  //   renderMessageBox(
  //     {
  //       object_id: this.props.data.id,
  //       object_type: this.objectType,
  //       import_type: import_type
  //     },
  //     'import',
  //     () => {
  //       closeMessageBox()
  //     }
  //   )
  // }

  // @todo is this ViewType or cfobjecttype
  expandAll(type: CfObjectType) {
    // this is weird, not defined in propstype
    this.props[type].forEach((week) =>
      // @ts-ignore
      toggleDropReduxAction(week.id, type, true, this.props.dispatch)
    )
  }

  collapseAll(type: CfObjectType) {
    // this is weird, not defined in propstype
    this.props[type].forEach((week) =>
      // @ts-ignore
      toggleDropReduxAction(week.id, type, false, this.props.dispatch)
    )
  }
  pushImport(imports, import_type, text, disabled) {
    let a_class = 'hover-shade'
    if (disabled) a_class = ' disabled'
    imports.push()
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  TypeIndicator = () => {
    const data = this.props.data
    let type_text = window.gettext(data.type)
    if (data.is_strategy) type_text += window.gettext(' strategy')
    return (
      <div className={'workflow-type-indicator ' + data.type}>{type_text}</div>
    )
  }

  Header = () => {
    const data = this.props.data
    const style: React.CSSProperties = {
      border: data.lock ? '2px solid ' + data.lock.user_colour : 'inherit'
    }

    return (
      <div
        className="project-header"
        style={style}
        // @ts-ignore
        onClick={(evt) => this.selection_manager.changeSelection(evt, this)}
      >
        <div className="project-header-top-line">
          <WorkflowTitle
            data={data}
            no_hyperlink={true}
            class_name="project-title"
          />
          {<this.TypeIndicator />}
        </div>
        <div className="project-header-info">
          <div className="project-info-section project-members">
            <h4>{window.gettext('Permissions')}</h4>
            <this.Users />
          </div>
          <div className="project-other">
            <div className="project-info-section project-description">
              <h4>{window.gettext('Description')}</h4>
              <CollapsibleText
                text={data.description}
                defaultText={window.gettext('No description')}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  Users = () => {
    if (!this.state.users) return null
    let users_group = []

    const author = this.state.users.author
    const editors = this.state.users.editors
    const commenters = this.state.users.commentors
    const viewers = this.state.users.viewers

    if (this.state.users.published) {
      users_group.push(
        <div className="user-name">
          {Utility.getUserTag('view')}
          <span className="material-symbols-rounded">public</span>{' '}
          {window.gettext('All CourseFlow')}
        </div>
      )
    }
    if (author)
      users_group.push(
        <div className="user-name">
          {Utility.getUserTag('author')}
          {Utility.getUserDisplay(author)}
        </div>
      )

    users_group.push([
      editors
        .filter((user) => user.id !== author.id)
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
          onClick={this.openShareDialog.bind(this)}
        >
          {window.gettext('Modify')}
        </div>
      )
    return users
  }

  getReturnLinksPortal() {
    const return_links = []
    if (this.project && !this.props.config.isStudent && !this.public_view) {
      return_links.push(
        <a
          className="hover-shade no-underline"
          id="project-return"
          href={COURSEFLOW_APP.globalContextData.path.html.update_path_temp.replace(
            String(0),
            this.project.id
          )}
        >
          <span className="material-symbols-rounded green">arrow_back_ios</span>
          <div>
            {window.gettext('Return to')}{' '}
            <WorkflowTitle
              class_name="inline"
              no_hyperlink={true}
              data={this.project}
            />
          </div>
        </a>
      )
    }
    if (this.public_view && this.props.config.workflowPermission.canView) {
      return_links.push(
        <a
          className="hover-shade no-underline"
          id="project-return"
          // @todo no
          href={COURSEFLOW_APP.globalContextData.path.html.update_path_temp.replace(
            String(0),
            this.project.id
          )}
        >
          <span className="material-symbols-rounded green">arrow_back_ios</span>
          <div>{window.gettext('Return to Editable Workflow')}</div>
        </a>
      )
    }

    // static .titlebar .title is in base.html
    return reactDom.createPortal(return_links, $('.titlebar .title')[0])
  }

  // @todo these will be our tab buttons
  ViewButtons = () => {
    const view_buttons = [
      {
        type: ViewType.WORKFLOW,
        name: window.gettext('Workflow View'),
        disabled: []
      },
      {
        type: ViewType.OUTCOME_EDIT,
        name: Utility.capWords(
          window.gettext('View') +
            ' ' +
            window.gettext(this.data.type + ' outcomes')
        ),
        disabled: []
      },
      {
        type: ViewType.OUTCOMETABLE,
        name: Utility.capWords(
          window.gettext(this.data.type + ' outcome') +
            ' ' +
            window.gettext('Table')
        ),
        disabled: []
      },
      {
        type: ViewType.ALIGNMENTANALYSIS,
        name: Utility.capWords(
          window.gettext(this.data.type + ' outcome') +
            ' ' +
            window.gettext('Analytics')
        ),
        disabled: ['activity']
      },
      {
        type: ViewType.GRID,
        name: window.gettext('Grid View'),
        disabled: ['activity', 'course']
      }
    ]
      .filter((item) => item.disabled.indexOf(this.data.type) == -1)
      .map((item, index) => {
        let view_class = 'hover-shade'
        if (item.type === this.context.viewType) view_class += ' active'
        return (
          <a
            key={index}
            id={'button_' + item.type}
            className={view_class}
            onClick={this.changeView.bind(this, item.type)}
          >
            {item.name}
          </a>
        )
      })

    return view_buttons
  }

  WorkflowContent = ({ viewType }: { viewType: ViewType }) => {
    switch (viewType) {
      case ViewType.OUTCOMETABLE: {
        this.allowed_tabs = [3]
        return <WorkflowTableView data={this.data} />
      }
      case ViewType.OUTCOME_EDIT: {
        if (this.data.type == 'program') {
          this.allowed_tabs = [3]
        } else {
          this.allowed_tabs = [2, 3]
        }
        return <OutcomeEditView />
      }
      case ViewType.ALIGNMENTANALYSIS: {
        this.allowed_tabs = [3]
        return <AlignmentView  />
      }

      case ViewType.GRID: {
        this.allowed_tabs = [3]
        return <GridView view_type={this.context.viewType} />
      }
      default: {
        this.allowed_tabs = [1, 2, 3, 4]
        if (this.props.config.workflowPermission.readOnly)
          this.allowed_tabs = [2, 3]

        // return <WorkflowView />
        return <WorkflowView />
      }
    }
  }

  Content = ({ viewType }: { viewType: ViewType }) => {
    if (this.data.is_strategy) {
      return <this.WorkflowContent viewType={viewType} />
    }

    return (
      <>
        <div className="workflow-view-select hide-print">
          <this.ViewButtons />
        </div>
        <this.WorkflowContent viewType={viewType} />
      </>
    )
  }

  /*******************************************************
   * VIEW BAR
   *******************************************************/
  Jump = () => {
    if (this.context.viewType !== ViewType.WORKFLOW) {
      return null
    }
    const nodebarweekworkflows = this.data.weekworkflow_set.map(
      (weekworkflow, index) => (
        <JumpToWeekWorkflow
          key={`weekworkflow-${weekworkflow}`}
          order={this.data.weekworkflow_set}
          // renderer={this.props.renderer}
          objectID={weekworkflow}
        />
      )
    )
    return (
      <div id="jump-to">
        <div className="hover-shade flex-middle">
          <span className="green material-symbols-rounded">
            keyboard_double_arrow_down
          </span>
          <div>{window.gettext('Jump to')}</div>
        </div>
        <div className="create-dropdown">{nodebarweekworkflows}</div>
      </div>
    )
  }

  Expand = () => {
    return (
      <div id="expand-collapse-all">
        <div className="hover-shade flex-middle">
          <span className="green material-symbols-rounded">zoom_out_map</span>
          <div>{window.gettext('Expand/Collapse')}</div>
        </div>
        <div className="create-dropdown">
          <div
            className="flex-middle hover-shade"
            onClick={this.expandAll.bind(this, CfObjectType.WEEK)}
          >
            <span className="green material-symbols-rounded">zoom_out_map</span>
            <div>{window.gettext('Expand all weeks')}</div>
          </div>
          <div
            className="flex-middle hover-shade"
            onClick={this.collapseAll.bind(this, CfObjectType.WEEK)}
          >
            <span className="green material-symbols-rounded">zoom_in_map</span>
            <div>{window.gettext('Collapse all weeks')}</div>
          </div>
          <hr />
          <div
            className="flex-middle hover-shade"
            onClick={this.expandAll.bind(this, CfObjectType.NODE)}
          >
            <span className="green material-symbols-rounded">zoom_out_map</span>
            <div>{window.gettext('Expand all nodes')}</div>
          </div>
          <div
            className="flex-middle hover-shade"
            onClick={this.collapseAll.bind(this, CfObjectType.NODE)}
          >
            <span className="green material-symbols-rounded">zoom_in_map</span>
            <div>{window.gettext('Collapse all nodes')}</div>
          </div>
          <hr />
          <div
            className="flex-middle hover-shade"
            onClick={this.expandAll.bind(this, CfObjectType.OUTCOME)}
          >
            <span className="green material-symbols-rounded">zoom_out_map</span>
            <div>{window.gettext('Expand all outcomes')}</div>
          </div>
          <div
            className="flex-middle hover-shade"
            onClick={this.collapseAll.bind(this, CfObjectType.OUTCOME)}
          >
            <span className="green material-symbols-rounded">zoom_in_map</span>
            <div>{window.gettext('Collapse all outcomes')}</div>
          </div>
        </div>
      </div>
    )
  }

  ViewBar = () => {
    return (
      <>
        <this.Jump />
        <this.Expand />
      </>
    )
  }

  /*******************************************************
   * USERBAR
   *******************************************************/
  UserBar = () => {
    if (!this.always_static) {
      return <ConnectionBar />
    }
    return <></>
  }

  /*******************************************************
   * VISIBLE BUTTONS
   *******************************************************/
  ShareButton = () => {
    if (this.readOnly) {
      return null
    }

    return (
      <div
        className="hover-shade"
        id="share-button"
        title={window.gettext('Sharing')}
        onClick={this.openShareDialog.bind(this)}
      >
        <span className="material-symbols-rounded filled"></span>
      </div>
    )
  }

  EditButton = () => {
    let edit
    if (!this.readOnly)
      edit = (
        <div
          className="hover-shade"
          id="edit-project-button"
          title={window.gettext('Edit Workflow')}
          onClick={this.openEditMenu.bind(this)}
        >
          {/*
           @todo  what is this 'edit' var? is this a mistake from refactor, or from before?
           will have to look in history again
           */}
          <span className="material-symbols-rounded filled">edit</span>
        </div>
      )
    return edit
  }

  VisibleButtons = () => (
    <>
      <this.EditButton />
      <this.ShareButton />
    </>
  )

  /*******************************************************
   *OVERFLOW LINKS
   *******************************************************/

  ExportButton = () => {
    if (this.public_view && !this.user_id) {
      return null
    }

    // @todo ...
    if (!this.props.config.workflowPermission.canView) {
      return null
    }

    return (
      <div
        id="export-button"
        className="hover-shade"
        onClick={this.openExportDialog.bind(this)}
      >
        <div>{window.gettext('Export')}</div>
      </div>
    )
  }

  CopyButton = () => {
    if (!this.user_id) return null
    const copy_to_button = [<CopyButton data={this.data} />]
    if (
      !this.data.is_strategy &&
      this.project_permission === Constants.permission_keys.edit
    ) {
      copy_to_button.unshift(
        <div
          id="copy-to-project-button"
          className="hover-shade"
          onClick={() => {
            const loader = COURSEFLOW_APP.tinyLoader
            loader.startLoad()
            duplicateBaseItemQuery(
              this.data.id,
              this.data.type,
              this.project.id,
              (response_data) => {
                loader.endLoad()
                // @ts-ignore
                window.location =
                  COURSEFLOW_APP.globalContextData.path.html.update_path_temp.replace(
                    '0',
                    // @ts-ignore
                    response_data.new_item.id
                  )
              }
            )
          }}
        >
          <div>{window.gettext('Copy into current project')}</div>
        </div>
      )
    }
    return copy_to_button
  }

  ImportButton = () => {
    if (this.readOnly) return null
    const disabled = !!this.data.importing
    const aClass = disabled ? ' disabled' : 'hover-shade'

    return <ImportButtons aClass={aClass} />
  }

  DeleteWorkflowButton = () => {
    if (this.readOnly) return null

    if (!this.data.deleted) {
      return (
        <>
          <hr />
          <div
            id="delete-workflow"
            className="hover-shade"
            onClick={this.deleteWorkflow.bind(this)}
          >
            <div>{window.gettext('Archive workflow')}</div>
          </div>
        </>
      )
    }

    return (
      <>
        <hr />
        <div
          id="restore-workflow"
          className="hover-shade"
          onClick={this.restoreWorkflow.bind(this)}
        >
          <div>{window.gettext('Restore workflow')}</div>
        </div>
        <div
          id="permanently-delete-workflow"
          className="hover-shade"
          onClick={this.deleteWorkflowHard.bind(this)}
        >
          <div>{window.gettext('Permanently delete workflow')}</div>
        </div>
      </>
    )
  }

  OverflowLinks = () => {
    return (
      <>
        <this.ExportButton />
        <this.CopyButton />
        <this.ImportButton />
        <this.DeleteWorkflowButton />
      </>
    )
  }
  /*******************************************************
   * MODALS
   *******************************************************/

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

  openImportDialog() {
    this.setState({
      ...this.state,
      openEditDialog: true
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
          data={this.props.data}
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

  ExportDialog = () => {
    return (
      <Dialog open={this.state.openExportDialog}>
        <DialogTitle>
          <h2>{window.gettext('Export project')}</h2>
        </DialogTitle>
        <ExportMenu
          data={{ ...this.props.data, object_sets: this.object_sets }}
          actionFunction={this.closeModals}
        />
      </Dialog>
    )
  }

  // ImportDialog = () => {
  //   return (
  //     <Dialog open={this.state.openImportDialog}>
  //       <>
  //         <ImportMenu
  //           data={{
  //             object_id: this.data.id,
  //             object_type: this.objectType,
  //             import_type: 'outcomes'
  //           }}
  //           actionFunction={this.closeModals}
  //         />
  //         <ImportMenu
  //           data={{
  //             object_id: this.data.id,
  //             object_type: this.objectType,
  //             import_type: 'nodes'
  //           }}
  //           actionFunction={this.closeModals}
  //         />
  //       </>
  //     </Dialog>
  //   )
  // }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    return (
      <DialogContextProvider>
        {this.addEditable(this.props.data)}
        <>{this.getReturnLinksPortal()}</>
        <div className="main-block">
          <MenuBar
            overflowLinks={this.OverflowLinks}
            visibleButtons={this.VisibleButtons}
            viewbar={this.ViewBar}
            userbar={this.UserBar}
          />
          <div className="right-panel-wrapper">
            <div className="body-wrapper">
              <div id="workflow-wrapper" className="workflow-wrapper">
                <this.Header />
                <div className="workflow-container">
                  <this.Content viewType={this.context.viewType} />
                </div>

                <ParentWorkflowIndicator workflow_id={this.workflowId} />
              </div>
            </div>
            <RightSideBar
              wfcontext={WFContext.WORKFLOW}
              data={this.props.data}
              readOnly={this.readOnly}
            />
          </div>

          <ProjectTargetModal
            id={this.data.id}
            actionFunction={(response_data) => {
              if (response_data.parentID != null) {
                const utilLoader = new UtilityLoader('body')
                duplicateBaseItemQuery(
                  this.data.id,
                  this.data.type,
                  response_data.parentID,
                  (response_data) => {
                    utilLoader.endLoad()
                    // @ts-ignore
                    window.location =
                      COURSEFLOW_APP.globalContextData.path.html.update_path_temp.replace(
                        '0',
                        // @ts-ignore
                        response_data.new_item.id
                      )
                  }
                )
              }
            }}
          />
          <ImportModal workflowID={this.data.id} />
          <this.ShareDialog />
        </div>
      </DialogContextProvider>
    )
  }
}

const mapStateToProps = (state: AppState): ConnectedProps => {
  return {
    data: state.workflow,
    object_sets: state.objectset,
    week: state.week,
    node: state.node,
    outcome: state.outcome
  }
}

const WorkflowBaseView = connect<
  ConnectedProps,
  DispatchProp,
  OwnProps,
  AppState
>(
  mapStateToProps,
  null
)(WorkflowBaseViewUnconnected)

export default WorkflowBaseView
