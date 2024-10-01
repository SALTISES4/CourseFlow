import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { EventUnion } from '@cf/types/common'
import { CfObjectType, WorkflowType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import { UtilityLoader } from '@cf/utility/UtilityLoader'
import { deleteSelfQueryLegacy } from '@XMLHTTP/API/delete'
import { duplicateBaseItemQuery } from '@XMLHTTP/API/duplication'
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
    dispatchDialog(DialogMode.ADD_CONTRIBUTOR)
  }

  function openExportDialog() {
    dispatchDialog(DialogMode.PROJECT_EXPORT)
  }

  function archiveWorkflow() {
    dispatchDialog(DialogMode.WORKFLOW_ARCHIVE)
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
      deleteSelfQueryLegacy(workflowId, 'workflow', false, () => {
        window.location.href = 'path to wherever you go after deletion'
      })
    }
  }

  // @todo is this ViewType or cfobjecttype
  function expandAll(type: CfObjectType) {
    // expand all by 'workflow type' and workflow content types
    // according to the redux store, which has 'week' 'node' and 'outcome'
    // hence this.props[type]
    // it's an array i.e. TOutcome[]
    // go trhough them all and call this redux method
    // @todo don't know how to fix this yet
    // this.props[type].forEach((week) =>
    //   toggleDropReduxAction(week.id, type, true, dispatch)
    // )
  }

  function collapseAll(type: CfObjectType) {
    // collapse all by 'workflow type' and workflow content types
    // according to the redux store, which has 'week' 'node' and 'outcome'
    // hence this.props[type]
    // it's an array i.e. TOutcome[]
    // go through them all and call this redux method
    // @todo don't know how to fix this yet
    // this.props[type].forEach((week) =>
    //   toggleDropReduxAction(week.id, type, false, dispatch)
    // )
  }

  function duplicateItem(
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
