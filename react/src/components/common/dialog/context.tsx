import { Dispatch, ReactNode, createContext, useReducer } from 'react'

export enum DIALOG_TYPE {
  CREATE_PROGRAM = 'create_program',
  CREATE_PROJECT = 'create_project',
  CREATE_ACTIVITY = 'create_activity',
  CREATE_COURSE = 'create_course',
  RESET_PASSWORD = 'reset_password'
}

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
