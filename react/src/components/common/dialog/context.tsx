import { Dispatch, ReactNode, createContext, useReducer } from 'react'
import { DIALOG_TYPE } from './'

type StateType = typeof defaultState

const defaultState = {
  type: null
}

function stateReducer(state: StateType, action: DIALOG_TYPE | null) {
  return {
    type: action
  }
}

export const DialogContext = createContext(defaultState)
export const DialogDispatchContext = createContext<Dispatch<DIALOG_TYPE>>(null)

export function DialogContextProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(stateReducer, defaultState)

  return (
    <DialogContext.Provider value={state}>
      <DialogDispatchContext.Provider value={dispatch}>
        {children}
      </DialogDispatchContext.Provider>
    </DialogContext.Provider>
  )
}
