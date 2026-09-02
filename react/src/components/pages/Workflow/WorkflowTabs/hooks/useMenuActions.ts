import { WorkflowType } from '@cf/api/gen'
import { deleteWorkflowPermanentlyMutation } from '@cf/api/gen/@tanstack/react-query.gen'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export const useMenuActions = () => {
  const { t } = useTranslation('workflow')
  const { dispatch: dispatchDialog } = useDialog()
  const navigate = useNavigate()
  const { onError, onSuccess } = useGenericMsgHandler()
  const deleteWorkflow = useMutation({
    ...deleteWorkflowPermanentlyMutation()
  })

  /*******************************************************
   * MENU HANDLERS
   *******************************************************/
  function openEditMenu() {
    dispatchDialog(DialogMode.WORKFLOW_EDIT)
  }

  function importOutcomes() {
    dispatchDialog(DialogMode.IMPORT_OUTCOMES)
  }

  function importNodes() {
    dispatchDialog(DialogMode.IMPORT_NODES)
  }

  function openShareDialog() {
    dispatchDialog(DialogMode.CONTRIBUTOR_ADD)
  }

  function openExportDialog() {
    dispatchDialog(DialogMode.PROJECT_EXPORT)
  }

  function archiveWorkflow() {
    dispatchDialog(DialogMode.ARCHIVE)
  }

  function restoreWorkflow() {
    dispatchDialog(DialogMode.RESTORE)
  }

  function copyToProject() {
    dispatchDialog(DialogMode.WORKFLOW_COPY_TO_PROJECT)
  }

  /*******************************************************
   * TO PROCESS
   *******************************************************/

  async function deleteWorkflowHard(workflowId: string) {
    if (!workflowId) {
      return
    }
    if (
      window.confirm(
        t('menu.deleteConfirmation')
      )
    ) {
      try {
        const response = await deleteWorkflow.mutateAsync({
          path: { uuid: workflowId }
        })
        onSuccess(response)
        navigate('/library')
      } catch (error) {
        onError(error)
      }
    }
  }

  function duplicateItem(
    parentId: string,
    workflowId: string,
    workflowType: WorkflowType
  ) {
    console.log('TODO: duplicate item', { parentId, workflowId, workflowType })
  }

  return {
    openEditMenu,
    openShareDialog,
    openExportDialog,
    copyToProject,
    importOutcomes,
    importNodes,
    archiveWorkflow,
    deleteWorkflowHard,
    restoreWorkflow,
    duplicateItem
  }
}
