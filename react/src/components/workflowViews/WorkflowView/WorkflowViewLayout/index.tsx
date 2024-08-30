import * as React from 'react'
import { connect, DispatchProp } from 'react-redux'

import RightSideBar from '@cfViews/components/rightSideBarContent/RightSideBar.jsx'
import * as Constants from '@cfConstants'
import ConnectionBar from '@cfViews/WorkflowView/WorkflowViewLayout/components/menuBar/ConnectionBar'

import { Dialog, DialogTitle } from '@mui/material'

import ShareMenu from '@cfCommonComponents/dialog/ShareMenu.jsx'
import ExportMenu from '@cfCommonComponents/dialog/ExportMenu.jsx'
import { AppState } from '@cfRedux/types/type'
import EditableComponent, {
  EditableComponentProps,
  EditableComponentStateType
} from '@cfEditableComponents/EditableComponent'
import { DIALOG_TYPE, useDialog } from '@cfModule/components/common/dialog'
import { CfObjectType, ViewType, WFContext } from '@cfModule/types/enum'
import { duplicateBaseItemQuery } from '@XMLHTTP/API/duplication'
import { getUsersForObjectQuery } from '@XMLHTTP/API/sharing'
import { deleteSelfQuery, restoreSelfQuery } from '@XMLHTTP/API/delete'
import {
  WorkFlowConfigContext,
  WorkFlowContextType
} from '@cfModule/context/workFlowConfigContext'

import { UtilityLoader } from '@cfModule/utility/UtilityLoader'
import { toggleDropReduxAction } from '@cfRedux/utility/helpers'
import { SelectionManager } from '@cfRedux/utility/SelectionManager'
import { EventUnion } from '@cfModule/types/common'
import ProjectTargetModal from '@cfModule/components/common/dialog/ProjectTarget'
import ImportModal from '@cfModule/components/common/dialog/Import'
import ActionCreator from '@cfRedux/ActionCreator'
import { getWorkflowParentDataQuery } from '@XMLHTTP/API/workflow'
import MenuBar from '@cfModule/components/common/layout/MenuBar'
import Header from '@cfViews/WorkflowView/WorkflowViewLayout/components/Header'

import WorkflowViewTabs from '@cfViews/WorkflowView/WorkflowViewLayout/components/WorkflowViewTabs'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import EditIcon from '@mui/icons-material/Edit'
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap'
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap'
import {
  MenuItemType,
  MenuWithOverflow,
  SimpleMenu
} from '@cfCommonComponents/menu/Menu'
import JumpToWeekWorkflow from '@cfViews/WorkflowView/WorkflowViewLayout/components/menuBar/JumpToWeekWorkflow'
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown'
import { _t } from '@cf/utility/utilityFunctions'

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

type OwnProps = {
  updateView: (viewType: ViewType) => void
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
  declare context: React.ContextType<typeof WorkFlowConfigContext>

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

  constructor(props: PropsType, context: WorkFlowContextType) {
    super(props)

    this.context = context

    this.data = this.props.data
    this.project = this.context.workflow.project
    this.workflowId = this.context.workflow.workflowID

    this.project_permission = this.context.permissions.projectPermission
    this.always_static = this.context.public_view

    this.state = {
      users: null,
      openShareDialog: false,
      openExportDialog: false,
      openImportDialog: false
    } as StateType
    this.selection_manager = this.context.selectionManager
  }

  /*******************************************************
   * LIFECYCLE
   *******************************************************/
  componentDidMount() {
    this.getUserData()
    this.updateTabs()

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
    // @todo should not be querying directly
    // needs a new permission, like canGetUserData
    if (this.public_view || this.context.user.isStudent) {
      return null
    }
    getUsersForObjectQuery(this.data.id, this.data.type, (data) => {
      this.setState({ users: data })
    })
  }

  changeView(type: ViewType) {
    this.props.updateView(type)
  }

  /*******************************************************
   * MENU HANDLERS
   *******************************************************/
  openEditMenu(evt: EventUnion) {
    this.selection_manager.changeSelection(evt, this)
  }

  copyToProject = () => {
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
  }

  // @todo swap back to real function after hook conversion
  // importOutcomes = () => dispatch(DIALOG_TYPE.IMPORT_OUTCOMES)
  // importNodes = () => dispatch(DIALOG_TYPE.IMPORT_NODES)
  importOutcomes = () => console.log('importOutcomes')
  importNodes = () => console.log('importNodes')

  deleteWorkflow() {
    if (
      window.confirm(
        _t('Are you sure you want to delete this workflow?')
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

  duplicateItem(response_data) {
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
  }

  // right sidebar tab handler
  // @todo this can be rewritten already
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

  /*******************************************************
   * MODALS, @todo move these into the global modal hook
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
          <h2>{_t('Share project')}</h2>
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
          <h2>{_t('Export project')}</h2>
        </DialogTitle>
        <ExportMenu
          data={{ ...this.props.data, object_sets: this.object_sets }}
          actionFunction={this.closeModals}
        />
      </Dialog>
    )
  }

  /*******************************************************
   * MENUS
   *******************************************************/
  JumpToMenu = () => {
    if (this.context.viewType !== ViewType.WORKFLOW) {
      return null
    }
    const menuItems: MenuItemType[] = this.data.weekworkflow_set.map(
      (weekworkflow, index) => {
        return {
          content: (
            <JumpToWeekWorkflow
              key={`weekworkflow-${weekworkflow}`}
              order={this.data.weekworkflow_set}
              objectID={weekworkflow}
            />
          ),
          action: null,
          show: true
        }
      }
    )
    const header: MenuItemType = {
      content: _t('Expand/Collapse'),
      icon: <KeyboardDoubleArrowDownIcon />,
      showIconInList: true,
      show: true
    }

    return <SimpleMenu menuItems={menuItems} header={header} />
  }

  ExpandCollapseMenu = () => {
    const header: MenuItemType = {
      content: _t('Expand/Collapse'),
      icon: <ZoomOutMapIcon />,
      showIconInList: true,
      show: true
    }

    const menuItems: MenuItemType[] = [
      {
        content: _t('Expand all weeks'),
        action: this.expandAll.bind(this, CfObjectType.WEEK),
        icon: <ZoomOutMapIcon />,
        showIconInList: true,
        show: true
      },
      {
        content: _t('Collapse all weeks'),
        action: this.collapseAll.bind(this, CfObjectType.WEEK),
        icon: <ZoomInMapIcon />,
        showIconInList: true,
        show: true
      },
      {
        content: _t('Expand all nodes'),
        action: this.expandAll.bind(this, CfObjectType.NODE),
        icon: <ZoomInMapIcon />,
        showIconInList: true,
        show: true
      },
      {
        content: _t('Collapse all nodes'),
        action: this.expandAll.bind(this, CfObjectType.NODE),
        icon: <ZoomOutMapIcon />,
        showIconInList: true,
        seperator: true,
        show: true
      },
      {
        content: _t('Expand all outcomes'),
        action: this.expandAll.bind(this, CfObjectType.OUTCOME),
        icon: <ZoomInMapIcon />,
        showIconInList: true,
        show: true
      },
      {
        content: _t('Collapse all outcomes'),
        action: this.expandAll.bind(this, CfObjectType.OUTCOME),
        icon: <ZoomOutMapIcon />,
        show: true
      }
    ]
    return <SimpleMenu header={header} menuItems={menuItems} />
  }

  ActionMenu = () => {
    const menuItems: MenuItemType[] = [
      {
        id: 'edit-project',
        title: _t('Edit Workflow'),
        action: this.openEditMenu.bind(this),
        content: <EditIcon />,
        show: !this.context.permissions.workflowPermission.readOnly
      },
      {
        id: 'share',
        title: _t('Sharing'),
        content: <PersonAddIcon />,
        action: this.openShareDialog.bind(this),
        show: !this.context.permissions.workflowPermission.readOnly
      },
      {
        id: 'export',
        content: _t('Export'),
        action: this.openExportDialog.bind(this),
        show:
          (!this.public_view || this.user_id) &&
          this.context.permissions.workflowPermission.canView,
        seperator: true
      },
      // hidden
      {
        id: 'copy-to-project',
        content: _t('Copy into current project'),
        action: this.copyToProject.bind(this),
        show:
          this.user_id &&
          !this.data.is_strategy &&
          this.project_permission === Constants.permission_keys.edit
      },
      {
        id: 'copy-to-library',
        content: _t('Copy to my library'),
        action: this.openExportDialog.bind(this),
        show: !(this.public_view && !this.user_id)
      },
      {
        id: 'import-outcomes',
        content: _t('Import outcomes'),
        action: this.importOutcomes.bind(this),
        show: !(this.public_view && !this.user_id)
      },
      {
        id: 'import-nodes',
        content: _t('Import nodes'),
        action: this.importNodes.bind(this),
        show: !(this.public_view && !this.user_id),
        seperator: true
      },
      {
        id: 'delete-workflow',
        action: this.deleteWorkflow.bind(this),
        content: _t('Archive workflow'),
        show: !this.readOnly && !this.data.deleted
      },
      {
        id: 'restore-workflow',
        action: this.restoreWorkflow.bind(this),
        content: _t('Restore workflow'),
        show: !this.readOnly && this.data.deleted
      },
      {
        id: 'hard-delete-workflow',
        action: this.deleteWorkflowHard.bind(this),
        content: _t('Permanently delete workflow'),
        show: !this.readOnly && this.data.deleted
      }
    ]

    return <MenuWithOverflow menuItems={menuItems} size={2} />
  }

  ViewBar = () => {
    return (
      <>
        <this.JumpToMenu />
        <this.ExpandCollapseMenu />
      </>
    )
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
      <>
        {this.addEditable(this.props.data)}

        <div className="main-block">
          <MenuBar
            leftSection={<this.ActionMenu />}
            viewbar={<this.ViewBar />}
            userbar={<ConnectionBar show={!this.always_static} />}
          />
          <div className="right-panel-wrapper">
            <div className="body-wrapper">
              <div id="workflow-wrapper" className="workflow-wrapper">
                <Header
                  users={this.state.users}
                  data={this.props.data}
                  openShareDialog={this.openShareDialog}
                />

                <WorkflowViewTabs
                  isStrategy={this.context.workflow.is_strategy}
                  viewType={this.context.viewType}
                  data={this.data} // @todo clean this up
                  changeView={this.changeView.bind(this)}
                />
              </div>
            </div>

            {/*<RightSideBar*/}
            {/*  wfcontext={WFContext.WORKFLOW}*/}
            {/*  data={this.props.data}*/}
            {/*  readOnly={this.readOnly}*/}
            {/*/>*/}
          </div>

          <ProjectTargetModal
            id={this.data.id}
            actionFunction={this.duplicateItem}
          />
          <ImportModal workflowID={this.data.id} />
          <this.ShareDialog />
        </div>
      </>
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

const WorkflowViewLayout = connect<
  ConnectedProps,
  DispatchProp,
  OwnProps,
  AppState
>(
  mapStateToProps,
  null
)(WorkflowBaseViewUnconnected)

export default WorkflowViewLayout
