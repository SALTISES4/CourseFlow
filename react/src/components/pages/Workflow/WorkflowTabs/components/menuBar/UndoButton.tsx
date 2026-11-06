import { getGraphUndoStatusOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { ResourceRole, WorkflowPermission } from '@cf/api/gen/types.gen'
import {
  hasPermission,
  useWorkspacePermissions
} from '@cf/context/workspacePermissionsContext'
import { selectGraphByUuid } from '@cf/features/graph/state/selectors/canonical.selectors'
import { undoGraphMutation } from '@cf/features/graph/state/thunks/graphMutations.thunks'
import useGenericQueryMsgHandler from '@cf/hooks/useGenericMsgHandler'
import type { AppDispatch } from '@cf/redux/store'
import { WorkflowViewType } from '@cfPages/Workflow/types'
import { useWorkflowViewTypeFromRoute } from '@cfPages/Workflow/WorkflowTabs/hooks/useWorkflowViewTypeFromRoute'
import UndoIcon from '@mui/icons-material/Undo'
import Button from '@mui/material/Button'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

const UNDO_VIEWS = new Set<WorkflowViewType>([
  WorkflowViewType.GRAPH,
  WorkflowViewType.OUTCOME_EDIT
])

const UndoButton = ({ graphUuid }: { graphUuid: string }) => {
  const { t } = useTranslation('workflow')
  const dispatch = useDispatch<AppDispatch>()
  const { onError } = useGenericQueryMsgHandler()
  const viewType = useWorkflowViewTypeFromRoute()
  const { resource: permissions } = useWorkspacePermissions()
  const [undoing, setUndoing] = useState(false)
  const graphSelector = useMemo(() => selectGraphByUuid(graphUuid), [graphUuid])
  const revisionId = useSelector(graphSelector)?.revisionId

  const isEditor =
    permissions.resourceRole === ResourceRole.OWNER ||
    permissions.resourceRole === ResourceRole.EDITOR
  const isUndoView = UNDO_VIEWS.has(viewType)
  const canMutate = hasPermission(
    permissions,
    WorkflowPermission.NODE_LINK_MANAGEMENT
  )
  const queryEnabled = isEditor && isUndoView && canMutate
  const {
    data: undoStatus,
    isFetching,
    refetch
  } = useQuery({
    ...getGraphUndoStatusOptions({ path: { uuid: graphUuid } }),
    enabled: queryEnabled
  })

  useEffect(() => {
    if (queryEnabled && revisionId !== undefined) {
      void refetch()
    }
  }, [queryEnabled, refetch, revisionId])

  const handleUndo = useCallback(async () => {
    if (undoing || !undoStatus?.available) {
      return
    }
    setUndoing(true)
    try {
      await dispatch(undoGraphMutation({ graphUuid }))
    } catch (error) {
      onError(error)
    } finally {
      await refetch()
      setUndoing(false)
    }
  }, [dispatch, graphUuid, onError, refetch, undoStatus?.available, undoing])

  if (!isEditor || !isUndoView) {
    return null
  }

  return (
    <Button
      size="small"
      startIcon={<UndoIcon />}
      disabled={!canMutate || isFetching || undoing || !undoStatus?.available}
      onClick={() => void handleUndo()}
      data-test-id="workflow-undo-button"
    >
      {t('menu.undo')}
    </Button>
  )
}

export default UndoButton
