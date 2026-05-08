import { duplicateProjectPlaceholderMutation } from '@cf/api/gen/@tanstack/react-query.gen'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { useMutation } from '@tanstack/react-query'

export const useMenuActions = () => {
  const { dispatch: dispatchDialog } = useDialog()

  const duplicateProjectMutation = useMutation({
    ...duplicateProjectPlaceholderMutation()
  })

  const { onError, onSuccess } = useGenericMsgHandler()

  /**
   *
   */
  function openEditDialog() {
    dispatchDialog(DialogMode.PROJECT_EDIT)
  }

  /**
   *
   */
  function openShareDialog() {
    dispatchDialog(DialogMode.CONTRIBUTOR_ADD)
  }

  /**
   *
   */
  function openExportDialog() {
    dispatchDialog(DialogMode.PROJECT_EXPORT)
  }

  /**
   *
   */
  function archiveProject() {
    dispatchDialog(DialogMode.ARCHIVE)
  }

  /**
   *
   */
  function unarchiveProject() {
    dispatchDialog(DialogMode.RESTORE)
  }

  /**
   *
   */
  function deleteProject() {
    dispatchDialog(DialogMode.PROJECT_DELETE)
  }

  /**
   *
   * @param projectUuid — v2 project UUID (path param for POST /api/project/{uuid}/duplicate)
   */
  async function duplicateProject(projectUuid: string) {
    try {
      const response = await duplicateProjectMutation.mutateAsync({
        path: { uuid: projectUuid }
      })
      onSuccess(response)
    } catch (err) {
      onError(err)
    }
  }

  return {
    openEditDialog,
    openShareDialog,
    openExportDialog,
    duplicateProject,
    archiveProject,
    unarchiveProject,
    deleteProject
  }
}
