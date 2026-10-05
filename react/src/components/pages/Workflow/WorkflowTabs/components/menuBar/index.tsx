import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { ProjectPermission, WorkflowPermission } from '@cf/api/gen/types.gen'
import {
  hasPermission,
  useWorkspacePermissions
} from '@cf/context/workspacePermissionsContext'
import { selectNodesByGraphUuid } from '@cf/features/graph/state/selectors/canonical.selectors'
import { selectAllOutcomes } from '@cf/features/graph/state/selectors/outcomes.selectors'
import { graphUiActions } from '@cf/features/graph/state/slices/graphUi.slice'
import { outcomeUiActions } from '@cf/features/graph/state/slices/outcomeUi.slice'
import { useGraphProjectTags } from '@cf/features/graph/useGraphProjectTags'
import { workflowTypeLabel } from '@cf/i18n/workflowLabels'
import type { AppDispatch, RootState } from '@cf/redux/store'
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
import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

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
      uuid: 'copy-to-project',
      content: t('menu.copy', { workflowType: localizedWorkflowType }),
      action: copyToProject,
      show: !isArchived && hasPermission(permissions, WorkflowPermission.COPY)
    },
    {
      uuid: 'archive-workflow',
      action: archiveWorkflow,
      content: t('menu.archive', { workflowType: localizedWorkflowType }),
      show:
        !isArchived && hasPermission(permissions, WorkflowPermission.ARCHIVE),
      separator: 'top'
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
  graphUuid,
  sectionIds
}: {
  graphUuid: string
  sectionIds: string[]
}) => {
  const { t } = useTranslation('workflow')
  const workflowViewType = useWorkflowViewTypeFromRoute()
  const dispatch = useDispatch<AppDispatch>()
  const nodeSelector = useMemo(
    () => selectNodesByGraphUuid(graphUuid),
    [graphUuid]
  )
  const nodes = useSelector(nodeSelector)
  const outcomes = useSelector(selectAllOutcomes)
  const hiddenNodeTagIds = useSelector(
    (state: RootState) => state.graph.graphUi.hiddenNodeTagIds
  )
  const hiddenOutcomeTagIds = useSelector(
    (state: RootState) => state.graph.graphUi.hiddenOutcomeTagIds
  )
  const { data: projectTags = [], isFetching: projectTagsLoading } =
    useGraphProjectTags(graphUuid)

  const graphOutcomes = useMemo(
    () => outcomes.filter((outcome) => outcome.graphUuid === graphUuid),
    [graphUuid, outcomes]
  )
  const tagsInUse = useMemo(() => {
    const tagIds =
      workflowViewType === WorkflowViewType.GRAPH
        ? nodes.flatMap((node) => node.tagIds)
        : graphOutcomes.flatMap((outcome) => outcome.tagIds)
    return new Set(tagIds)
  }, [graphOutcomes, nodes, workflowViewType])
  const displayedTags = useMemo(
    () =>
      projectTagsLoading
        ? []
        : projectTags.filter((tag) => tagsInUse.has(tag.id)),
    [projectTags, projectTagsLoading, tagsInUse]
  )

  useEffect(() => {
    dispatch(graphUiActions.clearViewSettingsTagFilters())
    dispatch(outcomeUiActions.setExpandedOutcomeUuids([]))
  }, [dispatch, graphUuid])

  const setTagVisibility = useCallback(
    (tagId: number, visible: boolean) => {
      if (workflowViewType === WorkflowViewType.GRAPH) {
        dispatch(graphUiActions.setNodeTagVisibility({ tagId, visible }))
      } else {
        dispatch(graphUiActions.setOutcomeTagVisibility({ tagId, visible }))
      }
    },
    [dispatch, workflowViewType]
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

  const menuItems: MenuItemType[] =
    workflowViewType === WorkflowViewType.GRAPH
      ? [
          {
            uuid: 'expand-all-sections',
            content: t('menu.expandSections'),
            action: () => dispatch(graphUiActions.setCollapsedSectionUuids([])),
            icon: <ZoomOutMapIcon />,
            showIconInList: true,
            show: true
          },
          {
            uuid: 'collapse-all-sections',
            content: t('menu.collapseSections'),
            action: () =>
              dispatch(graphUiActions.setCollapsedSectionUuids(sectionIds)),
            icon: <ZoomInMapIcon />,
            showIconInList: true,
            show: true
          }
        ]
      : [
          {
            uuid: 'expand-all-outcomes',
            content: t('menu.expandOutcomes'),
            action: () =>
              dispatch(
                outcomeUiActions.setExpandedOutcomeUuids(
                  graphOutcomes.map((outcome) => outcome.uuid)
                )
              ),
            icon: <ZoomOutMapIcon />,
            showIconInList: true,
            show: true
          },
          {
            uuid: 'collapse-all-outcomes',
            content: t('menu.collapseOutcomes'),
            action: () =>
              dispatch(outcomeUiActions.setExpandedOutcomeUuids([])),
            icon: <ZoomInMapIcon />,
            showIconInList: true,
            show: true
          }
        ]

  if (displayedTags.length > 0) {
    const hiddenTagIds =
      workflowViewType === WorkflowViewType.GRAPH
        ? hiddenNodeTagIds
        : hiddenOutcomeTagIds

    menuItems.push({
      uuid: 'view-settings-tags',
      content: (
        <Box>
          <Typography variant="subtitle2">{t('edit.tags')}</Typography>
          {displayedTags.map((tag) => (
            <FormControlLabel
              key={tag.id}
              control={
                <Checkbox
                  checked={!hiddenTagIds.includes(tag.id)}
                  onChange={(_, checked) => setTagVisibility(tag.id, checked)}
                  inputProps={{ 'aria-label': tag.label }}
                />
              }
              label={tag.label}
            />
          ))}
        </Box>
      ),
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
