import {
  DialogContext,
  DialogDispatchContext,
  StateType
} from '@cf/context/dialogContext'
import { Dispatch, ReactNode, useContext } from 'react'
import * as React from 'react'

export enum DIALOG_TYPE {
  // General
  LINK_WORKFLOW = 'link_workflow',
  TARGET_PROJECT = 'target_project',
  RESTORE = 'restore',

  // USER
  PASSWORD_RESET = 'password_reset',

  // PROJECT
  PROJECT_REMOVE_USER = 'project_user_remove',
  ADD_CONTRIBUTOR = 'add_contributor', // where is this?
  PROJECT_CREATE = 'project_create',
  PROJECT_EDIT = 'project_edit',
  PROJECT_EXPORT = 'project_export',
  PROJECT_ARCHIVE = 'project_archive',
  PROJECT_RESTORE = 'project_restore',
  PROJECT_DELETE = 'project_delete',

  // WORKFLOW
  IMPORT_OUTCOMES = 'import_outcomes',
  IMPORT_NODES = 'import_nodes',
  WORKFLOW_LINK = 'workflow_link',
  WORKFLOW_ARCHIVE = 'workflow_archive',

  WORKFLOW_DELETE = 'workflow_DELETE',
  WORKFLOW_EDIT = 'workflow_edit',
  WORKFLOW_COPY_TO_PROJECT = 'workflow_copy_to_project',

  PROGRAM_CREATE = 'program_create',
  ACTIVITY_CREATE = 'activity_create',
  COURSE_CREATE = 'course_create',

  GENERIC = 'generic'

  // TBD
}

/**
 * A hook/context consumer that is used to dynamically control
 * dialogs and dispatch events on demand.
 *
 * With `dialogType` property, you're getting back
 * properties and state for that specific dialog type.
 *
 * Without `dialogType` property you only get access to `dispatch`
 * in order to trigger an event that shows a modal.
 */

type PossibleDialogTypes = DIALOG_TYPE | DIALOG_TYPE[] | null

export function useDialog(dialogType: PossibleDialogTypes = null) {
  const dialogContext = useContext(DialogContext)
  const dialogDispatch = useContext(DialogDispatchContext)

  // if no dialog type is provided, just return the dispatch
  // as we're looking to open a specific dialog
  if (!dialogType) {
    return {
      show: false,
      type: null,
      onClose: () => {},
      dispatch: dialogDispatch
    }
  }

  // determine if we should show the dialog if we're working with
  // an array of registered dialogs
  let show = dialogContext.type === dialogType
  if (Array.isArray(dialogType) && dialogContext.type) {
    show = dialogType.includes(dialogContext.type)
  }

  // take dialogContext's local state as the main indicator if the
  // dialog should be shown or not
  show = dialogContext.show ? show : dialogContext.show

  // otherwise, return dispatch along with visibility/onClose method
  return {
    ...dialogContext,
    show,
    onClose: () => dialogDispatch(null),
    dispatch: dialogDispatch
  }
}
