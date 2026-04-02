import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { EventUnion } from '@cf/types/common'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import { WorkflowType } from '@cfPages/Workspace/Workflow/types'
import { AppDispatch } from '@cfRedux/store'
import { useDispatch } from 'react-redux'

export const useMenuActions = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { dispatch: dispatchDialog } = useDialog()

  /*******************************************************
   * MENU HANDLERS
   *******************************************************/
  function openEditMenu(evt: EventUnion) {
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

  function deleteWorkflowHard(projectid: string, workflowid: string) {
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

  // TODO: verify Nodes, Outcomes(?) still need to support this, reimplement
  function expandAll(type: CfObjectType) {
    console.log('expand all', type)
  }

  // TODO: verify Nodes, Outcomes(?) still need to support this, reimplement
  function collapseAll(type: CfObjectType) {
    console.log('collapse all', type)
  }

  function duplicateItem(
    parentid: string,
    workflowid: string,
    workflowType: WorkflowType
  ) {
    if (parentId != null) {
      // @todo
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
