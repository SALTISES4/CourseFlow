import { UserContext } from '@cf/context/userContext'
import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import {
  MenuItemType,
  MenuWithOverflow,
  SimpleMenu,
  SimpleSwitchMenu
} from '@cfComponents/menu/Menu'
import { WorkflowViewType } from '@cfPages/Workspace/Workflow/types'
import ScrollToWeek from '@cfPages/Workspace/Workflow/WorkflowTabs/components/menuBar/ScrollToWeek'
import { useMenuActions } from '@cfPages/Workspace/Workflow/WorkflowTabs/hooks/useMenuActions'
import { selectAllObjectSets } from '@cfRedux/selectors/objectSet.selector'
import {
  viewsettingsToggle,
  viewsettingsUpdate
} from '@cfRedux/slices/viewsettings.slice'
import { RootState } from '@cfRedux/store'
import EditIcon from '@mui/icons-material/Edit'
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import TuneIcon from '@mui/icons-material/Tune'
import { produce } from 'immer'
import { useContext, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

type ViewSettingsStateType = {
  [index: string]: boolean
}

const ActionMenu = () => {
  const userContext = useContext(UserContext)
  const workflow = useSelector((state: RootState) => state.workspace.workflow)
  const project = useSelector((state: RootState) => state.workspace.project)

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

  if (!workflow || !project) {
    return <></>
  }

  const isStrategy = workflow.isStrategy
  const userId = userContext.id
  const workflowId = workflow.id
  const projectId = project.id
  const workflowType = workflow.type
  const publicView = workflow.publicView

  const menuItems: MenuItemType[] = [
    {
      id: 'edit-project',
      title: _t('Edit Workflow'),
      action: openEditMenu,
      content: <EditIcon />,
      show: workflow.workflowPermissions.write
    },
    {
      id: 'share',
      title: _t('Sharing'),
      content: <PersonAddIcon />,
      action: openShareDialog,
      show: workflow.workflowPermissions.write
    },
    {
      id: 'export',
      content: _t('Export'),
      action: openExportDialog,
      show: (!publicView || userId) && workflow.workflowPermissions.read,
      seperator: true
    },
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
      show: workflow.workflowPermissions.write && !workflow.deleted
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

  return <MenuWithOverflow menuItems={menuItems} size={2} />
}

const ViewSettingsMenu = () => {
  const objectSets = useSelector((state: RootState) =>
    selectAllObjectSets(state)
  )
  const viewSettings = useSelector((state: RootState) => state.viewsettings)

  const { expandAll, collapseAll } = useMenuActions()
  const [viewState, setViewState] = useState<ViewSettingsStateType>({})
  const dispatch = useDispatch()

  const onSwitchMenuItemChange = (key: string, checked: boolean) => {
    setViewState(
      produce((draft) => {
        draft[key] = checked
      })
    )
  }

  function toggleExpandWeeks() {
    const weeks = viewSettings.expandedWeeks
    if (!weeks) {
      expandAll(CfObjectType.WEEK)
    } else {
      collapseAll(CfObjectType.WEEK)
    }
    dispatch(viewsettingsToggle({ key: 'expandedWeeks' }))
  }

  function toggleExpandNodes() {
    const nodes = viewSettings.expandedNodes
    if (!nodes) {
      expandAll(CfObjectType.NODE)
    } else {
      collapseAll(CfObjectType.NODE)
    }
    dispatch(viewsettingsToggle({ key: 'expandedNodes' }))
  }

  function toggleViewSetting(key: string) {
    dispatch(viewsettingsToggle({ key }))
  }

  function toggleObjectSet(id: number) {
    const objectset = viewSettings.objectset
    const clonedObjectset = [...objectset]

    const index = objectset.indexOf(id)
    if (index !== -1) {
      clonedObjectset.splice(index, 1)
    } else {
      clonedObjectset.push(id)
    }
    dispatch(viewsettingsUpdate({ objectset: clonedObjectset }))
  }

  const objectSetOptions = objectSets.map((item, index) => {
    return {
      content: item.title,
      action: () => toggleObjectSet(item.id),
      show: true
    }
  })

  const header: MenuItemType = {
    content: _t('View Settings'),
    icon: <TuneIcon />,
    showIconInList: true,
    show: true
  }

  const menuItems: MenuItemType[] = [
    // EXPAND
    {
      content: _t('Expand weeks'),
      action: () => toggleExpandWeeks(),
      show: true,
      defaultChecked: viewSettings.expandedWeeks
    },
    {
      content: _t('Expand nodes'),
      action: () => toggleExpandNodes(),
      show: true,
      defaultChecked: viewSettings.expandedNodes
    },
    // OUTCOMES
    {
      content: _t('Expand outcomes'),
      action: () => toggleViewSetting('expandedOutcomes'),
      seperator: true,
      show: true,
      defaultChecked: viewSettings.expandedOutcomes
    },
    // GLOBAL
    {
      content: _t('Condensed view'),
      action: () => toggleViewSetting('condensed'),
      seperator: true,
      show: true,
      defaultChecked: viewSettings.condensed
    },
    {
      content: _t('Display legend'),
      action: () => toggleViewSetting('legend'),
      show: true,
      seperator: true,
      defaultChecked: viewSettings.legend
    },
    {
      content: '',
      sectionTitle: _t('Object Set')
    },
    // OBJECT SETS
    ...objectSetOptions
  ]
  return (
    <SimpleSwitchMenu
      id="view-settings-menu"
      data-test-id="view-settings-menu"
      header={header}
      menuItems={menuItems}
    />
  )
}

const JumpToMenu = ({ weekIds }: { weekIds: number[] }) => {
  const context = useContext(WorkflowConfigContext)
  const viewType = context.workflowView

  if (viewType !== WorkflowViewType.WORKFLOW || !weekIds.length) {
    return null
  }
  const menuItems: MenuItemType[] = weekIds.map((item, index) => {
    return {
      content: <ScrollToWeek key={`weekworkflow-${item}`} objectId={item} />,
      action: null,
      show: true
    }
  })
  const header: MenuItemType = {
    content: _t('Jump to'),
    icon: <KeyboardDoubleArrowDownIcon />,
    showIconInList: true,
    show: true
  }

  return <SimpleMenu id={'JumpToMenu'} menuItems={menuItems} header={header} />
}

export { JumpToMenu, ActionMenu, ViewSettingsMenu }
