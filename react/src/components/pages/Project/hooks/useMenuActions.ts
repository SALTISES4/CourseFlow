import { DialogMode, useDialog } from '@cf/hooks/useDialog'

export const useMenuActions = () => {
  const { dispatch: dispatchDialog } = useDialog()

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
   * Open the whole-project copy dialog.
   */
  function openCopyDialog() {
    dispatchDialog(DialogMode.PROJECT_COPY)
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

  return {
    openEditDialog,
    openShareDialog,
    openExportDialog,
    openCopyDialog,
    archiveProject,
    unarchiveProject,
    deleteProject
  }
}
