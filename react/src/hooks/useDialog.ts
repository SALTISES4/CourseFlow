import { DialogContext, DialogDispatchContext } from '@cf/context/dialogContext'
import { WorkflowType } from '@cfPages/Workspace/Workflow/types'
import { useContext } from 'react'

export enum DialogMode {
  // Define your dialog modes here
  NODE_LINK_WORKFLOW = 'link_workflow',
  TARGET_PROJECT = 'target_project',

  // USER
  PASSWORD_RESET = 'password_reset',

  PROJECT_CREATE = 'project_create',
  PROJECT_EDIT = 'project_edit',
  PROJECT_EXPORT = 'project_export',
  PROJECT_DELETE = 'project_delete',

  // WORKFLOW
  IMPORT_OUTCOMES = 'import_outcomes',
  IMPORT_NODES = 'import_nodes',
  WORKFLOW_DELETE = 'workflow_DELETE',
  WORKFLOW_EDIT = 'workflow_edit',
  WORKFLOW_COPY_TO_PROJECT = 'workflow_copy_to_project',
  WORKFLOW_CREATE = 'workflow_create',
  WORKFLOW_DELETE_SECTION = 'workflow_delete_section',
  WORKFLOW_DELETE_NODE_CATEGORY = 'workflow_delete_node_category',

  // WORKSPACE
  CONTRIBUTOR_REMOVE = 'contributor_remove',
  CONTRIBUTOR_ADD = 'contributor_add', // where is this?
  RESTORE = 'restore',
  ARCHIVE = 'archive',

  GENERIC = 'generic'
}

export type DialogPayloadMap = {
  [DialogMode.CONTRIBUTOR_REMOVE]: { membershipId: number; username: string }
  [DialogMode.ARCHIVE]: { peopleId: string }
  [DialogMode.WORKFLOW_CREATE]: { workflowType: WorkflowType }
  [DialogMode.WORKFLOW_DELETE_SECTION]: {
    sectionid: string
    workflowid: string
  }
  [DialogMode.WORKFLOW_DELETE_NODE_CATEGORY]: {
    id: string
  }
  [DialogMode.NODE_LINK_WORKFLOW]: {
    id: string
  }

  /*******************************************************
   * we shouldn't need to  list out all the ones for undefined
   * but i couldn't get the typing correct for now
   *******************************************************/
  [DialogMode.TARGET_PROJECT]: undefined
  [DialogMode.PASSWORD_RESET]: undefined
  [DialogMode.PROJECT_CREATE]: undefined
  [DialogMode.PROJECT_EDIT]: undefined
  [DialogMode.PROJECT_EXPORT]: undefined
  [DialogMode.PROJECT_DELETE]: undefined
  [DialogMode.IMPORT_OUTCOMES]: undefined
  [DialogMode.IMPORT_NODES]: undefined
  [DialogMode.WORKFLOW_DELETE]: undefined
  [DialogMode.WORKFLOW_EDIT]: undefined
  [DialogMode.WORKFLOW_COPY_TO_PROJECT]: undefined
  [DialogMode.CONTRIBUTOR_ADD]: undefined
  [DialogMode.RESTORE]: undefined
  [DialogMode.GENERIC]: undefined
}

export function useDialog<T extends keyof DialogPayloadMap>(dialogType?: T) {
  const dialogContext = useContext(DialogContext)
  const dialogDispatch = useContext(DialogDispatchContext)

  // if no dialog type is provided, just return dispatch
  if (!dialogType) {
    return {
      show: false,
      type: null,
      onClose: () => {},
      dispatch: <D extends T>(type: D, payload?: DialogPayloadMap[D]) =>
        dialogDispatch({ type, payload })
    }
  }

  let show = dialogContext.type === dialogType
  show = dialogContext.show ? show : dialogContext.show

  return {
    show,
    type: dialogContext.type,
    payload: dialogContext.payload as DialogPayloadMap[T],
    onClose: () => dialogDispatch(null),
    dispatch: <D extends T>(type: D, payload?: DialogPayloadMap[D]) =>
      dialogDispatch({ type, payload })
  }
}
