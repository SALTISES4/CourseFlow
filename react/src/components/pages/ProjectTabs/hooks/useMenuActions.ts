import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { WorkflowType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import { UtilityLoader } from '@cf/utility/UtilityLoader'
import { duplicateBaseItemQuery } from '@XMLHTTP/API/duplication'

export const useMenuActions = () => {
  const { dispatch: dispatchDialog } = useDialog()

  /*******************************************************
   * MENU HANDLERS
   *******************************************************/
  function openEditDialog() {
    dispatchDialog(DialogMode.PROJECT_EDIT)
  }

  function openShareDialog() {
    dispatchDialog(DialogMode.ADD_CONTRIBUTOR)
  }

  function openExportDialog() {
    dispatchDialog(DialogMode.PROJECT_EXPORT)
  }

  function archiveProject() {
    dispatchDialog(DialogMode.ARCHIVE)
  }

  function unarchiveProject() {
    dispatchDialog(DialogMode.RESTORE)
  }

  function deleteProject() {
    dispatchDialog(DialogMode.PROJECT_DELETE)
  }
  /*******************************************************
   * TO PROCESS
   *******************************************************/

  // duplicateBaseItemQuery(
  //        project.id,
  //        project.type,
  //        null,
  //        (responseData) => {
  //          loader.endLoad()
  //          // @ts-ignore
  //          window.location =
  //            COURSEFLOW_APP.globalContextData.path.html.update_path_temp.replace(
  //              '0',
  //              // @ts-ignore
  //              responseData.newItem.id
  //            )
  //        }
  //      )

  function duplicateProject(
    parentId: number,
    workflowId: number,
    workflowType: WorkflowType
  ) {
    if (parentId != null) {
      const utilLoader = new UtilityLoader('body')

      duplicateBaseItemQuery(
        workflowId,
        workflowType,
        parentId,
        (responseData) => {
          utilLoader.endLoad()
          window.location.href = 'new iten path '
        }
      )
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
