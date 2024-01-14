// @ts-nocheck
import * as React from 'react'
import * as reactDom from 'react-dom'
import { connect } from 'react-redux'

import RightSideBar from '@cfCommonComponents/rightSideBarContent/RightSideBar.jsx'
import { renderMessageBox } from '@cfCommonComponents/menu/MenuComponents.jsx'
import * as Constants from '@cfConstants'
import * as Utility from '@cfUtility'
import ConnectionBar from '@cfModule/ConnectionBar'

import WorkflowView from '@cfViews/WorkflowView/WorkflowView'
import { OutcomeEditView } from '../OutcomeEditView/index.js'
import { AlignmentView } from '../AlignmentView/index.js'
import { GridView } from '../GridView/index.js'
import closeMessageBox from '@cfCommonComponents/menu/components/closeMessageBox'
import { toggleDropReduxAction } from '@cfRedux/helpers'
import JumpToWeekWorkflow from '@cfViews/WorkflowBaseView/JumpToWeekWorkflow'
import ParentWorkflowIndicator from '@cfViews/WorkflowBaseView/ParentWorkflowIndicator'
import WorkflowTableView from '@cfViews/WorkflowBaseView/WorkflowTableView'
import { Dialog, DialogTitle } from '@mui/material'
import ShareMenu from '@cfCommonComponents/dialog/ShareMenu.jsx'
import ExportMenu from '@cfCommonComponents/dialog/ExportMenu.jsx'
import ImportMenu from '@cfCommonComponents/dialog/ImportMenu.jsx'
import { WorkflowTitle } from '@cfUIComponents'
import CollapsibleText from '@cfUIComponents/CollapsibleText'
import { AppState } from '@cfRedux/type'
import EditableComponent from '@cfParentComponents/EditableComponent'
import { ComponentWithToggleProps } from '@cfParentComponents/ComponentWithToggleDrop'
import { ViewType } from '@cfModule/types/enum'
import MenuBar from '@cfCommonComponents/components/MenuBar'
import { duplicateBaseItemQuery } from '@XMLHTTP/API/global'
import { getTargetProjectMenu } from '@XMLHTTP/API/project'
import {getUsersForObjectQuery} from "@XMLHTTP/API/user";
import {deleteSelfQuery, restoreSelfQuery} from "@XMLHTTP/API/self";

type ConnectedProps = {
  data: AppState['workflow']
  object_sets: AppState['objectset']
  week: AppState['week']
  node: AppState['node']
  outcome: AppState['outcome']
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

type SelfProps = {
  view_type: string
  renderer: any
  id: number
  parentRender: (container, view_type: ViewType) => void // @todo delete his after converrting to state mgmt
} & ComponentWithToggleProps

type PropsType = ConnectedProps & SelfProps
type StateType = {
  users: any
  openShareDialog: boolean
  openExportDialog: boolean
  openImportDialog: boolean
  data?: any
}
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
  constructor(props: PropsType) {
    super(props)

    this.objectType = 'workflow'
    this.allowed_tabs = [0, 1, 2, 3, 4]

    this.readOnly = this.props.renderer.read_only
    this.public_view = this.props.renderer.public_view
    this.can_view = this.props.renderer.can_view
    this.can_view = this.props.renderer.is_student
    this.data = this.props.data
    this.project = this.props.renderer.project
    this.selection_manager = this.props.renderer.selection_manager

    // @todo important: change this to state update control
    // issues with loss of scope of this if assigned to local method in this
    this.renderMethod = this.props.parentRender

    this.container = this.props.renderer.container
    this.view_type = this.props.renderer.view_type
    this.websocket = this.props.renderer.websocket
    this.always_static = this.props.renderer.always_static
    this.user_id = this.props.renderer.user_id
    this.project_permission = this.props.renderer.project_permission
    this.object_sets = this.props.object_sets
    this.workflowId = this.props.renderer.workflowID

    this.state = {
      users: null,
      openShareDialog: false,
      openExportDialog: false,
      openImportDialog: false
    }
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.getUserData()
    this.updateTabs()
    COURSEFLOW_APP.makeDropdown('#jump-to')
    COURSEFLOW_APP.makeDropdown('#expand-collapse-all')
  }

  componentDidUpdate(prev_props) {}

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  getUserData() {
    if (this.public_view || this.is_student) return null
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
        window.location = COURSEFLOW_APP.config.update_path['project'].replace(
          0,
          this.project.id
        )
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
    for (let i = 0; i <= 4; i++)
      if (this.allowed_tabs.indexOf(i) < 0) disabled_tabs.push(i)

    /*******************************************************
     * JQUERY
     *******************************************************/
    $('#sidebar').tabs({ disabled: false })
    const current_tab = $('#sidebar').tabs('option', 'active')
    if (this.allowed_tabs.indexOf(current_tab) < 0) {
      if (this.allowed_tabs.length == 0) $('#sidebar').tabs({ active: false })
      else $('#sidebar').tabs({ active: this.allowed_tabs[0] })
    }
    // @todo remove renderer
    if (this.readOnly) disabled_tabs.push(5)
    $('#sidebar').tabs({ disabled: disabled_tabs })
    /*******************************************************
     * // JQUERY
     *******************************************************/
  }

  // @todo what are all the view types?
  changeView(type: ViewType) {
    // this.props.renderer.render(this.container, type)
    this.renderMethod(this.container, type)
  }

  expandAll(type: ViewType) {
    this.props[type].forEach((week) =>
      toggleDropReduxAction(week.id, type, true, this.props.dispatch)
    )
  }

  collapseAll(type: ViewType) {
    this.props[type].forEach((week) =>
      toggleDropReduxAction(week.id, type, false, this.props.dispatch)
    )
  }

  openEditMenu(evt) {
    this.selection_manager.changeSelection(evt, this)
  }

  clickImport(import_type, evt) {
    evt.preventDefault()
    renderMessageBox(
      {
        object_id: this.props.data.id,
        object_type: this.objectType,
        import_type: import_type
      },
      'import',
      () => {
        closeMessageBox()
      }
    )
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/
  Header = () => {
    const data = this.props.data
    const style = {}
    if (data.lock) {
      style.border = '2px solid ' + data.lock.user_colour
    }
    return (
      <div
        className="project-header"
        style={style}
        onClick={(evt) => this.selection_manager.changeSelection(evt, this)}
      >
        <div className="project-header-top-line">
          <WorkflowTitle
            data={data}
            no_hyperlink={true}
            class_name="project-title"
          />
          {this.getTypeIndicator()}
        </div>
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
          </div>
        </div>
      </div>
    )
  }

  getTypeIndicator() {
    const data = this.props.data
    let type_text = window.gettext(data.type)
    if (data.is_strategy) type_text += window.gettext(' strategy')
    return (
      <div className={'workflow-type-indicator ' + data.type}>{type_text}</div>
    )
  }

  getUsers() {
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

  pushImport(imports, import_type, text, disabled) {
    let a_class = 'hover-shade'
    if (disabled) a_class = ' disabled'
    imports.push()
  }

  getReturnLinks() {
    const return_links = []
    if (this.project && !this.is_student && !this.public_view) {
      return_links.push(
        <a
          className="hover-shade no-underline"
          id="project-return"
          href={COURSEFLOW_APP.config.update_path['project'].replace(
            0,
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
    if (this.public_view && this.can_view) {
      return_links.push(
        <a
          className="hover-shade no-underline"
          id="project-return"
          href={COURSEFLOW_APP.config.update_path['project'].replace(
            0,
            this.project.id
          )}
        >
          <span className="material-symbols-rounded green">arrow_back_ios</span>
          <div>{window.gettext('Return to Editable Workflow')}</div>
        </a>
      )
    }

    return reactDom.createPortal(return_links, $('.titlebar .title')[0])
  }

  Content = () => {
    // const data = this.data
    const renderer = this.props.renderer

    let workflow_content
    if (this.view_type == ViewType.OUTCOMETABLE) {
      workflow_content = (
        <WorkflowTableView
          data={this.data}
          renderer={renderer}
          view_type={this.view_type}
        />
      )
      this.allowed_tabs = [3]
    } else if (this.view_type == ViewType.OUTCOME_EDIT) {
      workflow_content = <OutcomeEditView renderer={renderer} />
      if (this.data.type == 'program') this.allowed_tabs = [3]
      else this.allowed_tabs = [2, 3]
    } else if (this.view_type == ViewType.ALIGNMENTANALYSIS) {
      workflow_content = (
        <AlignmentView renderer={renderer} view_type={this.view_type} />
      )
      this.allowed_tabs = [3]
    } else if (this.view_type == ViewType.GRID) {
      workflow_content = (
        <GridView renderer={renderer} view_type={this.view_type} />
      )
      this.allowed_tabs = [3]
    } else {
      workflow_content = <WorkflowView renderer={renderer} />
      this.allowed_tabs = [1, 2, 3, 4]
      if (renderer.read_only) this.allowed_tabs = [2, 3]
    }

    if (this.data.is_strategy) return workflow_content

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
      .map((item) => {
        let view_class = 'hover-shade'
        if (item.type === renderer.view_type) view_class += ' active'
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

    const view_buttons_sorted = view_buttons.slice(0, 2)
    view_buttons_sorted.push(
      <div
        className="hover-shade other-views"
        onClick={() => $('.views-dropdown')[0].classList.toggle('toggled')}
      >
        {window.gettext('Other Views')}
        <div className="views-dropdown">{view_buttons.slice(2)}</div>
      </div>
    )

    return [
      <div className="workflow-view-select hide-print">
        {view_buttons_sorted}
      </div>,
      workflow_content
    ]
  }

  /*******************************************************
   * VIEW BAR
   *******************************************************/
  Jump = () => {
    if (this.view_type !== ViewType.WORKFLOW) {
      return null
    }
    const nodebarweekworkflows = this.data.weekworkflow_set.map(
      (weekworkflow, index) => (
        <JumpToWeekWorkflow
          key={`weekworkflow-${index}`}
          order={this.data.weekworkflow_set}
          renderer={this.props.renderer}
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
            onClick={this.expandAll.bind(this, 'week')}
          >
            <span className="green material-symbols-rounded">zoom_out_map</span>
            <div>{window.gettext('Expand all weeks')}</div>
          </div>
          <div
            className="flex-middle hover-shade"
            onClick={this.collapseAll.bind(this, 'week')}
          >
            <span className="green material-symbols-rounded">zoom_in_map</span>
            <div>{window.gettext('Collapse all weeks')}</div>
          </div>
          <hr />
          <div
            className="flex-middle hover-shade"
            onClick={this.expandAll.bind(this, 'node')}
          >
            <span className="green material-symbols-rounded">zoom_out_map</span>
            <div>{window.gettext('Expand all nodes')}</div>
          </div>
          <div
            className="flex-middle hover-shade"
            onClick={this.collapseAll.bind(this, 'node')}
          >
            <span className="green material-symbols-rounded">zoom_in_map</span>
            <div>{window.gettext('Collapse all nodes')}</div>
          </div>
          <hr />
          <div
            className="flex-middle hover-shade"
            onClick={this.expandAll.bind(this, 'outcome')}
          >
            <span className="green material-symbols-rounded">zoom_out_map</span>
            <div>{window.gettext('Expand all outcomes')}</div>
          </div>
          <div
            className="flex-middle hover-shade"
            onClick={this.collapseAll.bind(this, 'outcome')}
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
    const renderer = this.props.renderer

    if (!this.always_static) {
      return (
        <ConnectionBar
          user_id={renderer.user_id}
          websocket={this.websocket}
          // connection_update_receive={this.props.renderer.connection_update_received}
          // renderer={renderer}
        />
      )
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
        <span className="material-symbols-rounded filled">person_add</span>
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
    if (this.can_view && !this.can_view) {
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
    const export_button = [
      <div
        id="copy-button"
        className="hover-shade"
        onClick={() => {
          const loader = COURSEFLOW_APP.tinyLoader
          if (this.data.is_strategy) {
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
          } else {
            getTargetProjectMenu(-1, (response_data) => {
              if (response_data.parentID != null) {
                const utilLoader = new Utility.Loader('body')
                duplicateBaseItemQuery(
                  this.data.id,
                  this.data.type,
                  response_data.parentID,
                  (response_data) => {
                    utilLoader.endLoad()
                    window.location = COURSEFLOW_APP.config.update_path[
                      response_data.new_item.type
                    ].replace('0', response_data.new_item.id)
                  }
                )
              }
            })
          }
        }}
      >
        <div>{window.gettext('Copy to my library')}</div>
      </div>
    ]
    if (
      !this.data.is_strategy &&
      this.project_permission === Constants.permission_keys.edit
    )
      export_button.unshift(
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
                window.location = COURSEFLOW_APP.config.update_path[
                  response_data.new_item.type
                ].replace('0', response_data.new_item.id)
              }
            )
          }}
        >
          <div>{window.gettext('Copy into current project')}</div>
        </div>
      )
    return export_button
  }

  ImportButton = () => {
    if (this.readOnly) return null
    const disabled = !!this.data.importing
    const aClass = disabled ? ' disabled' : 'hover-shade'

    return (
      <>
        <hr />
        <a className={aClass} onClick={this.clickImport.bind(this, 'outcomes')}>
          {window.gettext('Import Outcomes')}
        </a>
        <a className={aClass} onClick={this.clickImport.bind(this, 'nodes')}>
          {window.gettext('Import Nodes')}
        </a>
      </>
    )
  }

  DeleteWorkflowButton = () => {
    if (this.readOnly) return null
    if (!this.data.deleted)
      return [
        <hr />,
        <div
          id="delete-workflow"
          className="hover-shade"
          onClick={this.deleteWorkflow.bind(this)}
        >
          <div>{window.gettext('Archive workflow')}</div>
        </div>
      ]
    else
      return [
        <hr />,
        <div
          id="restore-workflow"
          className="hover-shade"
          onClick={this.restoreWorkflow.bind(this)}
        >
          <div>{window.gettext('Restore workflow')}</div>
        </div>,
        <div
          id="permanently-delete-workflow"
          className="hover-shade"
          onClick={this.deleteWorkflowHard.bind(this)}
        >
          <div>{window.gettext('Permanently delete workflow')}</div>
        </div>
      ]
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

  ImportDialog = () => {
    return (
      <Dialog open={this.state.openImportDialog}>
        <>
          <ImportMenu
            data={{
              object_id: this.data.id,
              object_type: this.objectType,
              import_type: 'outcomes'
            }}
            actionFunction={this.closeModals}
          />
          <ImportMenu
            data={{
              object_id: this.data.id,
              object_type: this.objectType,
              import_type: 'nodes'
            }}
            actionFunction={this.closeModals}
          />
        </>
      </Dialog>
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  render() {
    return (
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
              {<this.Header />}
              {/*
              @todo raise up this portal call
              */}
              {this.addEditable(this.props.data)}

              <div className="workflow-container">
                <this.Content />
              </div>
              {this.getReturnLinks()}
              <ParentWorkflowIndicator
                renderer={this.props.renderer}
                workflow_id={this.workflowId}
              />
            </div>
          </div>
          <RightSideBar
            context="workflow"
            renderer={this.props.renderer}
            data={this.props.data}
            parentRender={this.renderMethod}
          />
        </div>

        <this.ShareDialog />
        <this.ExportDialog />
        <this.ImportDialog />
      </div>
    )
  }
}

const mapStateToProps = (state: AppState): ConnectedState => {
  return {
    data: state.workflow,
    object_sets: state.objectset,
    week: state.week,
    node: state.node,
    outcome: state.outcome
  }
}

export const WorkflowBaseView = connect<
  ConnectedProps,
  NonNullable<unknown>,
  SelfProps,
  AppState
>(
  mapStateToProps,
  null
)(WorkflowBaseViewUnconnected)
