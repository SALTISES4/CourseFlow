import { useContext } from 'react'
import { DialogDispatchContext, DialogContext, DIALOG_TYPE } from './context'

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
export function useDialog(dialogType: DIALOG_TYPE = null) {
  const dialogContext = useContext(DialogContext)
  const dialogDispatch = useContext(DialogDispatchContext)

  // if no dialog type is provided, just return the dispatch
  // as we're looking to open a specific dialog
  if (!dialogType) {
    return {
      dispatch: dialogDispatch
    }
  }

  // otherwise, return dispatch along with visibility/onClose method
  return {
    show: dialogContext.type === dialogType,
    onClose: () => dialogDispatch(null),
    dispatch: dialogDispatch
  }
}
