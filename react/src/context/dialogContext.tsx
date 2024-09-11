import { DIALOG_TYPE } from '@cf/hooks/useDialog'
import { _t } from '@cf/utility/utilityFunctions'
import { Dispatch, ReactNode, createContext, useState } from 'react'

type ActionType = DIALOG_TYPE | null

const initialState: StateType = {
  type: null,
  show: false
}

export type StateType = {
  type: ActionType
  show: boolean
}

export const DialogContext = createContext<StateType>(initialState)
export const DialogDispatchContext = createContext<Dispatch<ActionType>>(
  () => null
)

export function DialogContextProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StateType>({ show: false, type: null })

  // A bit more complicated state management to allow us
  // to register multiple different types of the same dialog
  // and keep local "variant" until it's dismissed

  // ie, if there's no type provided, we fall back to whatever
  // previous state.type value was
  // and visibility is toggled

  const handleDispatch = (action: ActionType) => {
    const show = !action ? false : action !== state.type ? true : !state.show

    setState({
      show,
      type: action || state.type
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
