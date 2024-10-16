import { DialogMode, DialogPayloadMap } from '@cf/hooks/useDialog'
import { _t } from '@cf/utility/utilityFunctions'
import { Dispatch, ReactNode, createContext, useState } from 'react'

/*******************************************************
 * TYPES
 *******************************************************/
const initialState: StateType = {
  type: null,
  show: false,
  payload: undefined
}

export type StateType = {
  type: DialogMode | null
  show: boolean
  payload?: DialogPayloadMap[keyof DialogPayloadMap]
}

type ActionType<T extends keyof DialogPayloadMap> = {
  type: T
  payload?: DialogPayloadMap[T]
}

/*******************************************************
 * CONTEXT
 *******************************************************/
export const DialogContext = createContext<StateType>(initialState)
export const DialogDispatchContext = createContext<Dispatch<ActionType<any>>>(
  () => null
)

/**
 *
 * @param children
 * @constructor
 */
export function DialogContextProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StateType>(initialState)

  const handleDispatch = (action: ActionType<any> | null) => {
    if (action === null) {
      // Handle the case where null is dispatched (i.e., onClose)
      setState({
        show: false,
        type: null,
        payload: undefined // Reset the payload when closing the dialog, watch for side effects on this one
      })
      return
    }

    const show = action.type !== state.type ? true : !state.show

    setState({
      show,
      type: action.type || state.type,
      payload: action.payload || state.payload // not sure about whether we should be trying to juggle state
    })
  }

  return (
    <DialogContext.Provider value={state}>
      <DialogDispatchContext.Provider value={handleDispatch}>
        {children}
      </DialogDispatchContext.Provider>
    </DialogContext.Provider>
  )
}
