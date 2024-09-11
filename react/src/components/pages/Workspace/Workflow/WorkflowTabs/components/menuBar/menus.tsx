import * as Constants from '@cf/constants'
import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { CfObjectType, WorkflowViewType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import ProjectTargetDialog from '@cfComponents/dialog/Workspace/ProjectTargetDialog'
import {
  MenuItemType,
  MenuWithOverflow,
  SimpleMenu
} from '@cfComponents/menu/Menu'
import JumpToWeekWorkflow from '@cfPages/Workspace/Workflow/WorkflowTabs/components/menuBar/JumpToWeekWorkflow'
import { useMenuActions } from '@cfPages/Workspace/Workflow/WorkflowTabs/hooks/useMenuActions'
import { AppState } from '@cfRedux/types/type'
import EditIcon from '@mui/icons-material/Edit'
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap'
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap'
import { useContext, useState } from 'react'
import * as React from 'react'
import { useSelector } from 'react-redux'

import ImportDialog from 'components/common/dialog/Workspace/ImportDialog'

type StateType = {
  openShareDialog: boolean
  openExportDialog: boolean
  openImportDialog: boolean
  openEditDialog: boolean
}

const ActionMenu = ({ isWorkflowDeleted }: { isWorkflowDeleted: boolean }) => {
  const context = useContext(WorkFlowConfigContext)

  const isStrategy = context.workflow.is_strategy
  const userId = context.user.user_id
  const workflowPermission = context.permissions.workflowPermission
  const projectPermission = context.permissions.projectPermission
  const workflowId = context.workflow.workflowId
  const projectId = context.workflow.project.id
  const workflowType = context.workflow
  const publicView = context.public_view

  const [state, setState] = useState<StateType>({
    openShareDialog: false,
    openExportDialog: false,
    openImportDialog: false,
    openEditDialog: false
  })
  const objectSets = useSelector<AppState>((state: AppState) => state.objectset)
  const week = useSelector<AppState>((state: AppState) => state.week)
  const node = useSelector<AppState>((state: AppState) => state.node)
  const outcome = useSelector<AppState>((state: AppState) => state.outcome)

  /*******************************************************
   * MODALS
   *******************************************************/

  const duplicateItem = () => {
    console.log('duplicateItem')
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

  const {
    openEditMenu,
    openShareDialog,
    openExportDialog,
    copyToProject,
    importOutcomes,
    importNodes,
    archiveWorkflow,
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
      id: 'archive-workflow',
      action: archiveWorkflow,
      content: _t('Archive workflow'),
      show: !workflowPermission.readOnly && !isWorkflowDeleted
    },
    {
      id: 'restore-workflow',
      action: restoreWorkflow,
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

  return (
    <>
      <MenuWithOverflow menuItems={menuItems} size={2} />
      <ProjectTargetDialog
        id={workflowId}
        //@ts-ignore
        actionFunction={duplicateItem}
      />
      <ImportDialog workflowId={workflowId} />
      {/*<ShareDialog />*/}
    </>
  )
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
  return (
    <SimpleMenu id="ExpandCollapseMenu" header={header} menuItems={menuItems} />
  )
}

const JumpToMenu = ({ weekWorkflowSet }: { weekWorkflowSet: number[] }) => {
  const context = useContext(WorkFlowConfigContext)
  const viewType = context.workflowView

  if (viewType !== WorkflowViewType.WORKFLOW || !weekWorkflowSet.length) {
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

  return <SimpleMenu id={'JumpToMenu'} menuItems={menuItems} header={header} />
}

export { JumpToMenu, ActionMenu, ExpandCollapseMenu }
