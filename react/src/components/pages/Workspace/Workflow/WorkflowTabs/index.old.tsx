// @ts-nocheck

import ExportMenu from '@cfCommonComponents/dialog/ExportMenu.jsx'
import ShareMenu from '@cfCommonComponents/dialog/ShareMenu.jsx'
import * as Constants from '@cfConstants'
import EditableComponent, {
  EditableComponentProps,
  EditableComponentStateType
} from '@cfEditableComponents/EditableComponent'
import { DIALOG_TYPE, useDialog } from '@cfModule/components/common/dialog'
import { DialogContextProvider } from '@cfModule/components/common/dialog/context'
import ImportModal from '@cfModule/components/common/dialog/Import'
import ProjectTargetModal from '@cfModule/components/common/dialog/ProjectTarget'
import MenuBar from '@cfModule/components/common/layout/MenuBar'
import {
  WorkFlowConfigContext,
  WorkFlowContextType
} from '@cfModule/context/workFlowConfigContext'
import { EventUnion } from '@cfModule/types/common'
import { CfObjectType, ViewType, WFContext } from '@cfModule/types/enum'
import { UtilityLoader } from '@cfModule/utility/UtilityLoader'
import ActionCreator from '@cfRedux/ActionCreator'
import { AppState } from '@cfRedux/types/type'
import { toggleDropReduxAction } from '@cfRedux/utility/helpers'
import { SelectionManager } from '@cfRedux/utility/SelectionManager'
import RightSideBar from '@cfViews/components/rightSideBarContent/RightSideBar.jsx'
import Header from '@cfViews/WorkflowView/WorkflowViewLayout/components/Header'
import ConnectionBar from '@cfViews/WorkflowView/WorkflowViewLayout/components/menuBar/ConnectionBar'
import ParentWorkflowIndicator from '@cfViews/WorkflowView/WorkflowViewLayout/components/ParentWorkflowIndicator'
import ReturnLinks from '@cfViews/WorkflowView/WorkflowViewLayout/components/ReturnLinks'
import WorkflowViewTabs from '@cfViews/WorkflowView/WorkflowViewLayout/components/WorkflowViewTabs'
import EditIcon from '@mui/icons-material/Edit'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { Dialog, DialogTitle } from '@mui/material'
import { deleteSelfQuery, restoreSelfQuery } from '@XMLHTTP/API/delete'
import { duplicateBaseItemQuery } from '@XMLHTTP/API/duplication'
import { getUsersForObjectQuery } from '@XMLHTTP/API/sharing'
import { getWorkflowParentDataQuery } from '@XMLHTTP/API/workflow'
import { ReactElement } from 'react'
import * as React from 'react'
import { DispatchProp, connect } from 'react-redux'

import {
  IconMenuItem,
  ListMenuItem,
  MenuItemType
} from './components/menuBar/MenuButtons'

type ConnectedProps = {
  data: AppState['workflow']
  objectSets: AppState['objectset']
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

  private publicView: any
  private data: ConnectedProps['data']
  private project: any
  private selectionManager: SelectionManager
  private always_static: boolean
  private userId: any
  private projectPermission: number
  private objectSets: any
  private workflowId: number

  constructor(props: PropsType, context: WorkFlowContextType) {
    super(props)

    this.context = context

    console.log('this.context')
    console.log(this.context)

    this.data = this.props.data
    this.project = this.context.workflow.project
    this.workflowId = this.context.workflow.workflowId

    this.projectPermission = this.context.permissions.projectPermission
    this.always_static = this.context.publicView

    this.state = {
      users: null,
      openShareDialog: false,
      openExportDialog: false,
      openImportDialog: false
    } as StateType
    this.selectionManager = this.context.selectionManager
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
          ActionCreator.refreshStoreData(response.dataPackage)
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
    if (this.publicView ) {
      return null
    }
    getUsersForObjectQuery(this.data.id, this.data.type, (data) => {
      this.setState({ users: data })
    })
  }

  /*******************************************************
   * MENU HANDLERS
   *******************************************************/
  openEditMenu(evt: EventUnion) {
    this.selectionManager.changeSelection(evt, this)
  }

  copyToProject = () => {
    const loader = COURSEFLOW_APP.tinyLoader
    loader.startLoad()
    duplicateBaseItemQuery(
      this.data.id,
      this.data.type,
      this.project.id,
      (responseData) => {
        loader.endLoad()
        // @ts-ignore
        window.location =
          COURSEFLOW_APP.globalContextData.path.html.update_path_temp.replace(
            '0',
            // @ts-ignore
            responseData.newItem.id
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

  pushImport(imports, importType, text, disabled) {
    let a_class = 'hover-shade'
    if (disabled) a_class = ' disabled'
    imports.push()
  }

  duplicateItem(responseData) {
    if (responseData.parentID != null) {
      const utilLoader = new UtilityLoader('body')
      duplicateBaseItemQuery(
        this.data.id,
        this.data.type,
        responseData.parentID,
        (responseData) => {
          utilLoader.endLoad()
          // @ts-ignore
          window.location =
            COURSEFLOW_APP.globalContextData.path.html.update_path_temp.replace(
              '0',
              // @ts-ignore
              responseData.newItem.id
            )
        }
      )
    }
  }

  // right sidebar tab handler
  // @todo this can be rewritten already
  updateTabs() {
    //If the view type has changed, enable only appropriate tabs, and change the selection to none
    this.selectionManager.changeSelection(null, null)
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
   * FUNCTIONS AND MENU HANDLERS
   *******************************************************/
  changeView(type: ViewType) {
    this.props.updateView(type)
  }

  /*******************************************************
   * COMPONENTS
   *******************************************************/

  // @todo these will be our tab buttons

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

  updateFunction(newData) {
    if (newData.liveproject) {
      console.log('liveproject updated')
    } else {
      this.setState({
        ...this.state,
        data: {
          ...this.state.data,
          ...newData
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
          data={{ ...this.props.data, objectSets: this.objectSets }}
          actionFunction={this.closeModals}
        />
      </Dialog>
    )
  }

  MenuItems = (): [ReactElement[], ReactElement[]] => {
    const menuActions: MenuItemType[] = [
      {
        id: 'edit-project',
        title: window.gettext('Edit Workflow'),
        action: this.openEditMenu.bind(this),
        icon: <EditIcon />,
        show: !this.context.permissions.workflowPermissions.readOnly
      },

      {
        id: 'share',
        title: window.gettext('Sharing'),
        action: this.openShareDialog.bind(this),
        icon: <PersonAddIcon />,
        show: !this.context.permissions.workflowPermissions.readOnly
      },
      {
        id: 'export',
        title: window.gettext('Export'),
        action: this.openExportDialog.bind(this),
        icon: null,
        show:
          (!this.publicView || this.userId) &&
          this.context.permissions.workflowPermissions.canView,
        seperator: true
      },
      // hidden
      {
        id: 'copy-to-project',
        title: window.gettext('Copy into current project'),
        action: this.copyToProject.bind(this),
        icon: null,
        show:
          this.userId &&
          !this.data.isStrategy &&
          this.projectPermission === Constants.permissionKeys.edit
      },
      {
        id: 'copy-to-library',
        title: window.gettext('Copy to my library'),
        action: this.openExportDialog.bind(this),
        icon: null,
        show:
          !(this.publicView && !this.userId) &&
          !(this.publicView && !this.userId)
      },
      {
        id: 'import-outcomes',
        title: window.gettext('Import outcomes'),
        action: this.importOutcomes.bind(this),
        icon: null,
        show:
          !(this.publicView && !this.userId) &&
          !(this.publicView && !this.userId)
      },
      {
        id: 'import-nodes',
        title: window.gettext('Import nodes'),
        action: this.importNodes.bind(this),
        icon: null,
        show:
          !(this.publicView && !this.userId) &&
          !(this.publicView && !this.userId),
        seperator: true
      },
      {
        id: 'delete-workflow',
        action: this.deleteWorkflow.bind(this),
        title: window.gettext('Archive workflow'),
        icon: null,
        show: !this.readOnly && !this.data.deleted
      },
      {
        id: 'restore-workflow',
        action: this.restoreWorkflow.bind(this),
        title: window.gettext('Restore workflow'),
        icon: null,
        show: !this.readOnly && this.data.deleted
      },
      {
        id: 'hard-delete-workflow',
        action: this.deleteWorkflowHard.bind(this),
        title: window.gettext('Permanently delete workflow'),
        icon: null,
        show: !this.readOnly && this.data.deleted
      }
    ]

    const withIcons = []
    const withoutIcons = []

    menuActions.forEach((item) => {
      if (item.icon) {
        withIcons.push(<IconMenuItem key={item.id} {...item} />)
      } else {
        withoutIcons.push(<ListMenuItem key={item.id} {...item} />)
      }
    })

    return [withIcons, withoutIcons] // Returns a tuple of arrays
  }

  // clickImport(importType, evt) {
  //   evt.preventDefault()
  //   renderMessageBox(
  //     {
  //       objectId: this.props.data.id,
  //       objectType: this.objectType,
  //       importType: importType
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
  //             objectId: this.data.id,
  //             objectType: this.objectType,
  //             importType: 'outcomes'
  //           }}
  //           actionFunction={this.closeModals}
  //         />
  //         <ImportMenu
  //           data={{
  //             objectId: this.data.id,
  //             objectType: this.objectType,
  //             importType: 'nodes'
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
    const [iconMenuItems, listMenuItems] = this.MenuItems()

    return (
      <DialogContextProvider>
        {this.addEditable(this.props.data)}
        <ReturnLinks
          project={this.project}
          publicView={this.publicView}
          canView={this.context.permissions.workflowPermissions.canView}
        />
        <div className="main-block">
          <MenuBar
            visibleButtons={iconMenuItems}
            overflowButtons={listMenuItems}
            // viewbar={<ViewBar />}
            viewbar={<div>hello</div>}
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
                  isStrategy={this.context.workflow.isStrategy}
                  viewType={this.context.viewType}
                  data={this.data} // @todo clean this up
                  changeView={this.changeView.bind(this)}
                />

                <ParentWorkflowIndicator workflowId={this.workflowId} />
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
            actionFunction={this.duplicateItem}
          />
          <ImportModal workflowId={this.data.id} />
          <this.ShareDialog />
        </div>
      </DialogContextProvider>
    )
  }
}

const mapStateToProps = (state: AppState): ConnectedProps => {
  return {
    data: state.workflow,
    objectSets: state.objectset,
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
