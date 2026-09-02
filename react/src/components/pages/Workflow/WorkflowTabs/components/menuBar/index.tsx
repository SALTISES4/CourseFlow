import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { ProjectPermission, WorkflowPermission } from '@cf/api/gen/types.gen'
import {
  hasPermission,
  useWorkspacePermissions
} from '@cf/context/workspacePermissionsContext'
import { graphUiActions } from '@cf/features/graph/state/slices/graphUi.slice'
import type { AppDispatch, RootState } from '@cf/redux/store'
import { CfObjectType } from '@cf/types/enum'
import { workflowTypeLabel } from '@cf/i18n/workflowLabels'
import {
  MenuItemType,
  MenuWithOverflow,
  SimpleMenu
} from '@cfComponents/menu/Menu'
import { WorkflowViewType } from '@cfPages/Workflow/types'
import { useMenuActions } from '@cfPages/Workflow/WorkflowTabs/hooks/useMenuActions'
import { useWorkflowViewTypeFromRoute } from '@cfPages/Workflow/WorkflowTabs/hooks/useWorkflowViewTypeFromRoute'
import EditIcon from '@mui/icons-material/Edit'
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import TuneIcon from '@mui/icons-material/Tune'
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap'
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap'
import { FormControlLabel, Switch } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { produce } from 'immer'
import { ChangeEvent, ReactElement, useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import SectionTitle from './SectionTitle'

const ActionMenu = () => {
  const { t } = useTranslation('workflow')
  const { uuid } = useParams()
  const { data: workflowDetailResp } = useQuery({
    ...getWorkflowOptions({ path: { uuid: uuid! } }),
    enabled: Boolean(uuid)
  })
  const workflow = workflowDetailResp?.item
  const localizedWorkflowType = workflowTypeLabel(
    t,
    workflow?.workflowType,
    true
  )
  const { resource: permissions, project: projectPermissions } =
    useWorkspacePermissions()
  const isArchived = permissions.state === 'archived'
  const canEdit = hasPermission(permissions, WorkflowPermission.EDIT_ATTRIBUTES)

  /*******************************************************
   * MODALS
   *******************************************************/

  const {
    openEditMenu,
    openShareDialog,
    copyToProject,
    archiveWorkflow,
    restoreWorkflow,
    deleteWorkflowHard
  } = useMenuActions()

  const menuItems: MenuItemType[] = [
    {
      uuid: 'edit-project',
      title: t('menu.edit'),
      action: openEditMenu,
      iconButton: {
        icon: <EditIcon />,
        disabled: !canEdit
      },
      show: !isArchived
    },
    {
      uuid: 'share',
      title: t('menu.sharing'),
      iconButton: {
        icon: <PersonAddIcon />
      },
      action: openShareDialog,
      show:
        !isArchived &&
        hasPermission(projectPermissions, ProjectPermission.MANAGE_MEMBERS),
      separator: true
    },
    // NOTE: scoped out temporarily, see COURSEFLOW-489
    // {
    //   uuid: 'export',
    //   content: t('menu.export'),
    //   action: openExportDialog,
    //   show: (!publicView || userId) && workflow.workflowPermissions.read,
    //   separator: true
    // },
    // NOTE: scoped out temporarily, see COURSEFLOW-489
    // {
    //   uuid: 'import-outcomes',
    //   content: t('menu.importOutcomes'),
    //   action: importOutcomes,
    //   show: !(publicView && !userId)
    // },
    // {
    //   uuid: 'import-nodes',
    //   content: t('menu.importNodes'),
    //   action: importNodes,
    //   show: !(publicView && !userId),
    //   separator: true
    // },
    {
      uuid: 'archive-workflow',
      action: archiveWorkflow,
      content: t('menu.archive', { workflowType: localizedWorkflowType }),
      show:
        !isArchived && hasPermission(permissions, WorkflowPermission.ARCHIVE),
      separator: 'top'
    },
    {
      uuid: 'copy-to-project',
      content: t('menu.copy', { workflowType: localizedWorkflowType }),
      action: copyToProject,
      show: !isArchived && hasPermission(permissions, WorkflowPermission.COPY)
    },
    {
      uuid: 'restore-workflow',
      action: restoreWorkflow,
      content: t('menu.restore'),
      show: isArchived && hasPermission(permissions, WorkflowPermission.RESTORE)
    },
    {
      uuid: 'hard-delete-workflow',
      action: () => deleteWorkflowHard(workflow?.uuid ?? ''),
      content: t('menu.permanentlyDelete'),
      show:
        isArchived &&
        hasPermission(permissions, WorkflowPermission.DELETE_PERMANENTLY)
    }
  ]

  return (
    <MenuWithOverflow menuItems={menuItems} size={2} buttonColor="primary" />
  )
}

const ExpandCollapseMenu = ({
  legend,
  sectionIds
}: {
  legend?: ReactElement
  sectionIds: string[]
}) => {
  const { t } = useTranslation('workflow')
  const workflowViewType = useWorkflowViewTypeFromRoute()
  const dispatch = useDispatch<AppDispatch>()
  const collapsedSectionUuids = useSelector(
    (state: RootState) => state.graph.graphUi.collapsedSectionUuids
  )
  const [expanded, setExpanded] = useState({
    [CfObjectType.NODE]: true,
    [CfObjectType.OUTCOME]: true
  })

  const onExpandChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const type = event.target.value as CfObjectType
      const checked = event.target.checked

      if (type === CfObjectType.SECTION) {
        dispatch(
          graphUiActions.setCollapsedSectionUuids(checked ? [] : sectionIds)
        )
        return
      }

      setExpanded(
        produce((draft) => {
          draft[type] = checked
        })
      )
    },
    [dispatch, sectionIds]
  )

  if (workflowViewType === WorkflowViewType.OVERVIEW) {
    return null
  }

  const header: MenuItemType = {
    content: t('menu.viewSettings'),
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
              value={CfObjectType.SECTION}
              checked={collapsedSectionUuids.length === 0}
              onChange={onExpandChange}
              inputProps={{ 'aria-label': t('menu.expandSections') }}
            />
          }
          label={t('menu.expandSections')}
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
              inputProps={{ 'aria-label': t('menu.expandNodes') }}
            />
          }
          label={t('menu.expandNodes')}
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
              inputProps={{ 'aria-label': t('menu.expandOutcomes') }}
            />
          }
          label={t('menu.expandOutcomes')}
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
const JumpToMenu = ({ sectionIds }: { sectionIds: string[] }) => {
  const { t } = useTranslation('workflow')
  const viewType = useWorkflowViewTypeFromRoute()

  const scrollToHandler = useCallback((objectId: string) => {
    return () => {
      const sectionEl = document.querySelector(
        `[data-section-id='${objectId}']`
      )
      sectionEl?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }, [])

  if (viewType !== WorkflowViewType.GRAPH || !sectionIds.length) {
    return null
  }

  const menuItems: MenuItemType[] = sectionIds.map((sectionId) => ({
    content: (
      <SectionTitle key={`sectionworkflow-${sectionId}`} objectId={sectionId} />
    ),
    action: scrollToHandler(sectionId),
    show: true
  }))

  const header: MenuItemType = {
    content: t('menu.jumpTo'),
    icon: <KeyboardDoubleArrowDownIcon />,
    showIconInList: true,
    show: true
  }

  return <SimpleMenu id="jump-to-menu" menuItems={menuItems} header={header} />
}

export { JumpToMenu, ActionMenu, ExpandCollapseMenu }
