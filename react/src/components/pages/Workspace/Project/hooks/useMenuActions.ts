import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { CFRoutes } from '@cf/router/appRoutes'
import { generatePath, useNavigate } from 'react-router-dom'

export const useMenuActions = () => {
  const { dispatch: dispatchDialog } = useDialog()

  /*******************************************************
   * QUERY HOOK
   *******************************************************/

  // @todo replace
  const [mutate, { isSuccess, isError, error, data: updateData }] =
    useDuplicateProjectMutation()

  const { onError, onSuccess } = useGenericMsgHandler()
  const navigate = useNavigate()

  /*******************************************************
   * MENU HANDLERS
   *******************************************************/
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
   * @param id
   */
  async function duplicateProject(projectUuid: string) {
    try {
      const response = await mutate({ projectUuid }).unwrap()
      onSuccess(response)
      const url = generatePath(CFRoutes.PROJECT, {
        id: String(response.uuid)
      })
      navigate(url)
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
