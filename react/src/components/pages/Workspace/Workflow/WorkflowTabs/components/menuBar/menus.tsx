import { UserContext } from '@cf/context/userContext'
import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import {
  MenuItemType,
  MenuWithOverflow,
  SimpleMenu
} from '@cfComponents/menu/Menu'
import { WorkflowViewType } from '@cfPages/Workspace/Workflow/types'
import { useMenuActions } from '@cfPages/Workspace/Workflow/WorkflowTabs/hooks/useMenuActions'
import { RootState } from '@cfRedux/store'
import EditIcon from '@mui/icons-material/Edit'
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import TuneIcon from '@mui/icons-material/Tune'
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap'
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap'
import { FormControlLabel, Switch } from '@mui/material'
import { produce } from 'immer'
import {
  ChangeEvent,
  ReactElement,
  useCallback,
  useContext,
  useState
} from 'react'
import { useSelector } from 'react-redux'

import WeekTitle from './WeekTitle'

const ActionMenu = () => {
  const userContext = useContext(UserContext)
  const workflow = useSelector((state: RootState) => state.workspace.workflow)
  const project = useSelector((state: RootState) => state.workspace.project)

  const isStrategy = workflow.isStrategy
  const userId = userContext.id
  const workflowId = workflow.id
  const projectId = project.id
  const workflowType = workflow.type
  const publicView = workflow.publicView

  /*******************************************************
   * MODALS
   *******************************************************/

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
      title: _t('Edit workflow'),
      action: openEditMenu,
      iconButton: {
        icon: <EditIcon />
      },
      show: workflow.workflowPermissions.write
    },
    {
      id: 'share',
      title: _t('Sharing'),
      iconButton: {
        icon: <PersonAddIcon />
      },
      action: openShareDialog,
      show: workflow.workflowPermissions.write,
      separator: true
    },
    // NOTE: scoped out temporarily, see COURSEFLOW-489
    // {
    //   id: 'export',
    //   content: _t('Export'),
    //   action: openExportDialog,
    //   show: (!publicView || userId) && workflow.workflowPermissions.read,
    //   separator: true
    // },
    // hidden
    {
      id: 'copy-to-project',
      content: _t('Copy into current project'),
      // @ts-ignore @todo what is workflowType
      action: () => copyToProject(workflowId, projectId, workflowType),
      show: userId && !isStrategy
      // @todo find the project permissions
      // workflow.parentWorkflow\.projectPermission === Constants.permissionKeys.edit
    },
    {
      id: 'copy-to-library',
      content: _t('Copy to my library'),
      action: openExportDialog,
      show: !(publicView && !userId)
    },
    // NOTE: scoped out temporarily, see COURSEFLOW-489
    // {
    //   id: 'import-outcomes',
    //   content: _t('Import outcomes'),
    //   action: importOutcomes,
    //   show: !(publicView && !userId)
    // },
    // {
    //   id: 'import-nodes',
    //   content: _t('Import nodes'),
    //   action: importNodes,
    //   show: !(publicView && !userId),
    //   separator: true
    // },
    {
      id: 'archive-workflow',
      action: archiveWorkflow,
      content: _t('Archive workflow'),
      show: workflow.workflowPermissions.write && !workflow.deleted,
      separator: 'top'
    },
    {
      id: 'restore-workflow',
      action: restoreWorkflow,
      content: _t('Restore workflow'),
      show: workflow.workflowPermissions.write && workflow.deleted
    },
    {
      id: 'hard-delete-workflow',
      action: () => deleteWorkflowHard(projectId, workflowId),
      content: _t('Permanently delete workflow'),
      show: workflow.workflowPermissions.write && workflow.deleted
    }
  ]

  return (
    <MenuWithOverflow menuItems={menuItems} size={2} buttonColor="primary" />
  )
}

const ExpandCollapseMenu = ({ legend }: { legend?: ReactElement }) => {
  const context = useContext(WorkflowConfigContext)
  const { expandAll, collapseAll } = useMenuActions()
  const [expanded, setExpanded] = useState({
    [CfObjectType.WEEK]: true,
    [CfObjectType.NODE]: true,
    [CfObjectType.OUTCOME]: true
  })

  const onExpandChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const type = event.target.value as CfObjectType
      const checked = event.target.checked

      setExpanded(
        produce((draft) => {
          draft[type] = checked

          if (checked) {
            expandAll(type)
          } else {
            collapseAll(type)
          }
        })
      )
    },
    [expandAll, collapseAll]
  )

  if (context.workflowView === WorkflowViewType.OVERVIEW) {
    return null
  }

  const header: MenuItemType = {
    content: _t('View settings'),
    icon: <TuneIcon />,
    showIconInList: true,
    show: true
  }

  const menuItems: MenuItemType[] = [
    {
      content: (
        <FormControlLabel
          control={
            <Switch
              value={CfObjectType.WEEK}
              checked={expanded[CfObjectType.WEEK]}
              onChange={onExpandChange}
              inputProps={{ 'aria-label': 'controlled' }}
            />
          }
          label={_t('Expand all weeks')}
        />
      ),
      icon: <ZoomOutMapIcon />,
      showIconInList: true,
      show: true
    },
    {
      content: (
        <FormControlLabel
          control={
            <Switch
              value={CfObjectType.NODE}
              checked={expanded[CfObjectType.NODE]}
              onChange={onExpandChange}
              inputProps={{ 'aria-label': 'controlled' }}
            />
          }
          label={_t('Expand all nodes')}
        />
      ),
      icon: <ZoomInMapIcon />,
      showIconInList: true,
      show: true
    },
    {
      content: (
        <FormControlLabel
          control={
            <Switch
              value={CfObjectType.OUTCOME}
              checked={expanded[CfObjectType.OUTCOME]}
              onChange={onExpandChange}
              inputProps={{ 'aria-label': 'controlled' }}
            />
          }
          label={_t('Expand all outcomes')}
        />
      ),
      icon: <ZoomInMapIcon />,
      showIconInList: true,
      show: true
    }
  ]

  if (legend) {
    menuItems.unshift({
      content: legend,
      show: true
    })
  }

  return (
    <SimpleMenu
      id="actions-menu"
      data-test-id="ExpandCollapseMenu"
      header={header}
      menuItems={menuItems}
    />
  )
}

/*******************************************************
 * JUMP MENU
 *******************************************************/
const JumpToMenu = ({ weekIds }: { weekIds: number[] }) => {
  const context = useContext(WorkflowConfigContext)
  const viewType = context.workflowView

  const scrollToHandler = useCallback((objectid: string) => {
    return () => {
      const weekEl = document.querySelector(`[data-week-id='${objectId}']`)
      weekEl?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }, [])

  if (viewType !== WorkflowViewType.WORKFLOW || !weekIds.length) {
    return null
  }

  const menuItems: MenuItemType[] = weekIds.map((weekId) => ({
    content: <WeekTitle key={`weekworkflow-${weekId}`} objectId={weekId} />,
    action: scrollToHandler(weekId),
    show: true
  }))

  const header: MenuItemType = {
    content: _t('Jump to'),
    icon: <KeyboardDoubleArrowDownIcon />,
    showIconInList: true,
    show: true
  }

  return <SimpleMenu id="jump-to-menu" menuItems={menuItems} header={header} />
}

export { JumpToMenu, ActionMenu, ExpandCollapseMenu }
