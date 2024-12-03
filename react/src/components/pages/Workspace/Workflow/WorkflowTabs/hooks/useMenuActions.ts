import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { EventUnion } from '@cf/types/common'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import { WorkflowType } from '@cfPages/Workspace/Workflow/types'
import { weekChangeField } from '@cfRedux/slices/week.slice'
import { updateAllEntities } from '@cfRedux/thunks'
import { duplicateBaseItemQuery } from '@XMLHTTP/API/duplication'
import { deleteSelfQueryLegacy } from '@XMLHTTP/API/workspace.rtk'
import { useDispatch } from 'react-redux'

export const useMenuActions = () => {
  const dispatch = useDispatch()
  const { dispatch: dispatchDialog } = useDialog()

  /*******************************************************
   * MENU HANDLERS
   *******************************************************/
  function openEditMenu(evt: EventUnion) {
    // this.selectionManager.changeSelection(evt, this)
    dispatchDialog(DialogMode.WORKFLOW_EDIT)
  }

  // REFERENCE ORIGINAL DATA
  //           data={{
  //             objectId: this.data.id,
  //             objectType: this.objectType,
  //             importType: 'outcomes'
  //           }}
  //           actionFunction={this.closeModals}
  //         />
  //         <ImportMenu
  //           data={{
  //             objectId: this.data.id,
  //             objectType: this.objectType,
  //             importType: 'nodes'
  //           }}
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

  function deleteWorkflowHard(projectId: number, workflowId: number) {
    if (
      window.confirm(
        _t('Are you sure you want to permanently delete this workflow?')
      )
    ) {
      deleteSelfQueryLegacy(workflowId, CfObjectType.WORKFLOW, false, () => {
        window.location.href = 'path to wherever you go after deletion'
      })
    }
  }

  function expandAll(type: CfObjectType) {
    dispatch(updateAllEntities(type, () => ({ isDropped: true })))
  }

  function collapseAll(type: CfObjectType) {
    dispatch(updateAllEntities(type, () => ({ isDropped: false })))
  }

  function duplicateItem(
    parentId: number,
    workflowId: number,
    workflowType: WorkflowType
  ) {
    if (parentId != null) {

      duplicateBaseItemQuery(
        workflowId,
        workflowType,
        parentId,
        (responseData) => {
          window.location.href = 'new iten path '
        }
      )
    }
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
    expandAll,
    collapseAll,
    duplicateItem
  }
}
