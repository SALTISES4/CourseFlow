import {
  MenuItemType,
  MenuWithOverflow,
  SimpleMenu
} from '@cfComponents/menu/Menu'
import { _t } from '@cf/utility/utilityFunctions'
import EditIcon from '@mui/icons-material/Edit'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import * as Constants from '@cf/constants'
import { EventUnion } from '@cf/types/common'
import { duplicateBaseItemQuery } from '@XMLHTTP/API/duplication'
import {
  deleteSelfQueryLegacy,
  restoreSelfQueryLegacy
} from '@XMLHTTP/API/delete'
import { CfObjectType, ViewType, WorkflowType } from '@cf/types/enum'
import { toggleDropReduxAction } from '@cfRedux/utility/helpers'
import { UtilityLoader } from '@cf/utility/UtilityLoader'
import JumpToWeekWorkflow from '@cfPages/Workspace/Workflow/WorkflowTabs/components/menuBar/JumpToWeekWorkflow'
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown'
import { useMutation } from '@tanstack/react-query'
import { NotificationSettingsUpdateQueryResp } from '@XMLHTTP/types/query'
import { updateNotificationSettings } from '@XMLHTTP/API/user'
import { useDispatch } from 'react-redux'
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap'
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap'
import { WorkflowPermission } from '@cfPages/Workspace/Workflow/types'
import { useContext } from 'react'
import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'

const useMenuActions = () => {
  const dispatch = useDispatch()

  const { mutate } = useMutation<NotificationSettingsUpdateQueryResp>({
    mutationFn: updateNotificationSettings,
    onSuccess: (newNotificationsValue) => {
      // Dispatch the action to update local state after the API call is successful
      dispatch({
        type: 'SET_UPDATES',
        value: newNotificationsValue
      })
    },
    onError: (error) => {
      console.error('Error updating notifications:', error)
    }
  })

  /*******************************************************
   * MENU HANDLERS
   *******************************************************/
  function openEditMenu(evt: EventUnion) {
    // this.selection_manager.changeSelection(evt, this)
  }

  function copyToProject(
    workflowId: number,
    projectId: number,
    workflowType: WorkflowType
  ) {
    const loader = COURSEFLOW_APP.tinyLoader
    loader.startLoad()
    duplicateBaseItemQuery(
      workflowId,
      workflowType,
      projectId,
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
  function importOutcomes() {
    console.log('importOutcomes')
  }

  function importNodes() {
    console.log('importNodes')
  }

  function deleteWorkflow(workflowId: number) {
    if (window.confirm(_t('Are you sure you want to delete this workflow?'))) {
      deleteSelfQueryLegacy(workflowId, 'workflow', true, () => {})
    }
  }

  function deleteWorkflowHard(projectId: number, workflowId: number) {
    if (
      window.confirm(
        _t('Are you sure you want to permanently delete this workflow?')
      )
    ) {
      deleteSelfQueryLegacy(workflowId, 'workflow', false, () => {
        // @todo no
        const newPath =
          COURSEFLOW_APP.globalContextData.path.html.update_path_temp.replace(
            '0',
            projectId.toString()
          )
        window.location.href = newPath
      })
    }
  }

  function restoreWorkflow(workflowId: number) {
    restoreSelfQueryLegacy(workflowId, 'workflow', () => {})
  }

  // @todo is this ViewType or cfobjecttype
  function expandAll(type: CfObjectType) {
    // expand all by 'workflow type' and workflow content types
    // according to the redux store, which has 'week' 'node' and 'outcome'
    // hence this.props[type]
    // it's an array i.e. TOutcome[]
    // go trhough them all and call this redux method
    // @todo don't know how to fix this yet
    // this.props[type].forEach((week) =>
    //   toggleDropReduxAction(week.id, type, true, dispatch)
    // )
  }

  function collapseAll(type: CfObjectType) {
    // collapse all by 'workflow type' and workflow content types
    // according to the redux store, which has 'week' 'node' and 'outcome'
    // hence this.props[type]
    // it's an array i.e. TOutcome[]
    // go through them all and call this redux method
    // @todo don't know how to fix this yet
    // this.props[type].forEach((week) =>
    //   toggleDropReduxAction(week.id, type, false, dispatch)
    // )
  }

  function pushImport(imports, import_type, text, disabled) {
    let a_class = 'hover-shade'
    if (disabled) a_class = ' disabled'
    imports.push()
  }

  function duplicateItem(
    parentId: number,
    workflowId: number,
    workflowType: WorkflowType
  ) {
    if (parentId != null) {
      const utilLoader = new UtilityLoader('body')

      duplicateBaseItemQuery(
        workflowId,
        workflowType,
        parentId,
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

  function openShareDialog() {
    console.log('openShareDialog')
  }
  function openExportDialog() {
    console.log('openExportDialog')
  }

  return {
    openEditMenu,
    openShareDialog,
    openExportDialog,
    copyToProject,
    importOutcomes,
    importNodes,
    deleteWorkflow,
    deleteWorkflowHard,
    restoreWorkflow,
    expandAll,
    collapseAll,
    duplicateItem
  }
}

const ActionMenu = ({ isWorkflowDeleted }: { isWorkflowDeleted: boolean }) => {
  const context = useContext(WorkFlowConfigContext)

  const isStrategy = context.workflow.is_strategy
  const userId = context.user.user_id
  const workflowPermission = context.permissions.workflowPermission
  const projectPermission = context.permissions.projectPermission
  const workflowId = context.workflow.workflowID
  const projectId = context.workflow.project.id
  const workflowType = context.workflow
  const publicView = context.public_view
  // ts-ignore

  const {
    openEditMenu,
    openShareDialog,
    openExportDialog,
    copyToProject,
    importOutcomes,
    importNodes,
    deleteWorkflow,
    restoreWorkflow,
    deleteWorkflowHard
  } = useMenuActions()

  const menuItems: MenuItemType[] = [
    {
      id: 'edit-project',
      title: _t('Edit Workflow'),
      action: openEditMenu,
      content: <EditIcon />,
      show: !workflowPermission.readOnly
    },
    {
      id: 'share',
      title: _t('Sharing'),
      content: <PersonAddIcon />,
      action: openShareDialog,
      show: !workflowPermission.readOnly
    },
    {
      id: 'export',
      content: _t('Export'),
      action: openExportDialog,
      show: (!publicView || userId) && workflowPermission.canView,
      seperator: true
    },
    // hidden
    {
      id: 'copy-to-project',
      content: _t('Copy into current project'),
      // @ts-ignore @todo what is workflowType
      action: () => copyToProject(workflowId, projectId, workflowType),
      show:
        userId &&
        !isStrategy &&
        projectPermission === Constants.permission_keys.edit
    },
    {
      id: 'copy-to-library',
      content: _t('Copy to my library'),
      action: openExportDialog,
      show: !(publicView && !userId)
    },
    {
      id: 'import-outcomes',
      content: _t('Import outcomes'),
      action: importOutcomes,
      show: !(publicView && !userId)
    },
    {
      id: 'import-nodes',
      content: _t('Import nodes'),
      action: importNodes,
      show: !(publicView && !userId),
      seperator: true
    },
    {
      id: 'delete-workflow',
      action: () => deleteWorkflow(workflowId),
      content: _t('Archive workflow'),
      show: !workflowPermission.readOnly && !isWorkflowDeleted
    },
    {
      id: 'restore-workflow',
      action: () => restoreWorkflow(workflowId),
      content: _t('Restore workflow'),
      show: !workflowPermission.readOnly && isWorkflowDeleted
    },
    {
      id: 'hard-delete-workflow',
      action: () => deleteWorkflowHard(projectId, workflowId),
      content: _t('Permanently delete workflow'),
      show: !workflowPermission.readOnly && isWorkflowDeleted
    }
  ]

  return <MenuWithOverflow menuItems={menuItems} size={2} />
}

const ExpandCollapseMenu = () => {
  const { expandAll, collapseAll } = useMenuActions()

  const header: MenuItemType = {
    content: _t('Expand/Collapse'),
    icon: <ZoomOutMapIcon />,
    showIconInList: true,
    show: true
  }

  const menuItems: MenuItemType[] = [
    {
      content: _t('Expand all weeks'),
      action: expandAll(CfObjectType.WEEK),
      icon: <ZoomOutMapIcon />,
      showIconInList: true,
      show: true
    },
    {
      content: _t('Collapse all weeks'),
      action: collapseAll(CfObjectType.WEEK),
      icon: <ZoomInMapIcon />,
      showIconInList: true,
      show: true
    },
    {
      content: _t('Expand all nodes'),
      action: expandAll(CfObjectType.NODE),
      icon: <ZoomInMapIcon />,
      showIconInList: true,
      show: true
    },
    {
      content: _t('Collapse all nodes'),
      action: expandAll(CfObjectType.NODE),
      icon: <ZoomOutMapIcon />,
      showIconInList: true,
      seperator: true,
      show: true
    },
    {
      content: _t('Expand all outcomes'),
      action: expandAll(CfObjectType.OUTCOME),
      icon: <ZoomInMapIcon />,
      showIconInList: true,
      show: true
    },
    {
      content: _t('Collapse all outcomes'),
      action: expandAll(CfObjectType.OUTCOME),
      icon: <ZoomOutMapIcon />,
      show: true
    }
  ]
  return <SimpleMenu header={header} menuItems={menuItems} />
}

const JumpToMenu = ({
  viewType,
  weekWorkflowSet
}: {
  viewType: ViewType
  weekWorkflowSet: number[]
}) => {
  if (viewType !== ViewType.WORKFLOW) {
    return null
  }
  const menuItems: MenuItemType[] = weekWorkflowSet.map(
    (weekWorkflow, index) => {
      return {
        content: (
          <JumpToWeekWorkflow
            key={`weekworkflow-${weekWorkflow}`}
            order={weekWorkflowSet}
            objectId={weekWorkflow}
          />
        ),
        action: null,
        show: true
      }
    }
  )
  const header: MenuItemType = {
    content: _t('Jump to'),
    icon: <KeyboardDoubleArrowDownIcon />,
    showIconInList: true,
    show: true
  }

  return <SimpleMenu menuItems={menuItems} header={header} />
}

export { JumpToMenu, ActionMenu, ExpandCollapseMenu }
