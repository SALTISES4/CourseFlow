import { DialogContext, DialogDispatchContext } from '@cf/context/dialogContext'
import { useContext } from 'react'
import * as React from 'react'

export enum DialogMode {
  // Define your dialog modes here
  LINK_WORKFLOW = 'link_workflow',
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
  WORKFLOW_LINK = 'workflow_link',
  WORKFLOW_DELETE = 'workflow_DELETE',
  WORKFLOW_EDIT = 'workflow_edit',
  WORKFLOW_COPY_TO_PROJECT = 'workflow_copy_to_project',
  PROGRAM_CREATE = 'program_create',
  ACTIVITY_CREATE = 'activity_create',
  COURSE_CREATE = 'course_create',

  // WORKSPACE
  CONTRIBUTOR_REMOVE = 'contributor_remove',
  CONTRIBUTOR_ADD = 'contributor_add', // where is this?
  RESTORE = 'restore',
  ARCHIVE = 'archive',

  GENERIC = 'generic'
}

export type DialogPayloadMap = {
  [DialogMode.CONTRIBUTOR_REMOVE]: { userId: number; userName: string }
  [DialogMode.ARCHIVE]: { peopleId: string }

  /*******************************************************
   * we shouldn't need to  list out all the ones for undefined
   * but i couldn't get the typing correct for now
   *******************************************************/

  [DialogMode.LINK_WORKFLOW]: undefined
  [DialogMode.TARGET_PROJECT]: undefined
  [DialogMode.PASSWORD_RESET]: undefined
  [DialogMode.PROJECT_CREATE]: undefined
  [DialogMode.PROJECT_EDIT]: undefined
  [DialogMode.PROJECT_EXPORT]: undefined
  [DialogMode.PROJECT_DELETE]: undefined
  [DialogMode.IMPORT_OUTCOMES]: undefined
  [DialogMode.IMPORT_NODES]: undefined
  [DialogMode.WORKFLOW_LINK]: undefined
  [DialogMode.WORKFLOW_DELETE]: undefined
  [DialogMode.WORKFLOW_EDIT]: undefined
  [DialogMode.WORKFLOW_COPY_TO_PROJECT]: undefined
  [DialogMode.PROGRAM_CREATE]: undefined
  [DialogMode.ACTIVITY_CREATE]: undefined
  [DialogMode.COURSE_CREATE]: undefined
  [DialogMode.CONTRIBUTOR_ADD]: undefined
  [DialogMode.RESTORE]: undefined
  [DialogMode.GENERIC]: undefined
}

export function useDialog<T extends keyof DialogPayloadMap>(dialogType?: T) {
  const dialogContext = useContext(DialogContext)
  const dialogDispatch = useContext(DialogDispatchContext)

  // if no dialog type is provided, just return the dispatch
  if (!dialogType) {
    return {
      show: false,
      type: null,
      onClose: () => {},
      dispatch: <D extends T>(type: D, payload?: DialogPayloadMap[D]) =>
        dialogDispatch({ type, payload })
    }
  }

  // to control whether the dialog shows
  let show = dialogContext.type === dialogType
  show = dialogContext.show ? show : dialogContext.show

  return {
    show,
    type: dialogContext.type,
    payload: dialogContext.payload as DialogPayloadMap[T], // Cast payload to the specific type
    onClose: () => dialogDispatch(null),
    dispatch: <D extends T>(type: D, payload?: DialogPayloadMap[D]) =>
      dialogDispatch({ type, payload })
  }
}
