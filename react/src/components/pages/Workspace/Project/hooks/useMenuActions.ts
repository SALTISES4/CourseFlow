import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { CFRoutes } from '@cf/router/appRoutes'
import { _t } from '@cf/utility/utilityFunctions'
import {
  useCreateProjectMutation,
  useDuplicateProjectMutation
} from '@XMLHTTP/API/project.rtk'
import { enqueueSnackbar } from 'notistack'
import { generatePath, useNavigate } from 'react-router-dom'

export const useMenuActions = () => {
  const { dispatch: dispatchDialog } = useDialog()

  /*******************************************************
   * QUERY HOOK
   *******************************************************/
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
  async function duplicateProject(id: number) {
    try {
      const response = await mutate({ id }).unwrap()
      onSuccess(response)
      const url = generatePath(CFRoutes.PROJECT, {
        id: String(response.dataPackage.id)
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

/*
 * graveyard
 * */

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

// duplicateBaseItemQuery(
//   workflowId,
//   workflowType,
//   parentId,
//   (responseData) => {
//     window.location.href = 'new iten path '
//   }
// )
