import { WorkflowType } from '@cf/components/pages/Workflow/types'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'

export const useMenuActions = () => {
  const { dispatch: dispatchDialog } = useDialog()

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

  function deleteWorkflowHard(projectId: string, workflowId: string) {
    if (
      window.confirm(
        _t('Are you sure you want to permanently delete this workflow?')
      )
    ) {
      console.log('TODO: delete workflow', { projectId, workflowId })
      // deleteSelfQueryLegacy(workflowId, CfObjectType.WORKFLOW, false, () => {
      //   window.location.href = 'path to wherever you go after deletion'
      // })
    }
  }

  // TODO: verify Nodes, Outcomes(?) still need to support this, reimplement
  function expandAll(type: CfObjectType) {
    console.log('TODO: expand all', type)
  }

  // TODO: verify Nodes, Outcomes(?) still need to support this, reimplement
  function collapseAll(type: CfObjectType) {
    console.log('TODO: collapse all', type)
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
    expandAll,
    collapseAll,
    duplicateItem
  }
}
