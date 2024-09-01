import { Dispatch, ReactNode, createContext, useState } from 'react'
import { DIALOG_TYPE } from '@cf/hooks/useDialog'
import { _t } from '@cf/utility/utilityFunctions'

type ActionType = DIALOG_TYPE | null

const initialState: StateType = {
  type: null,
  show: false
}

type StateType = {
  type: ActionType
  show: boolean
}

export const DialogContext = createContext<StateType>(initialState)
export const DialogDispatchContext = createContext<Dispatch<ActionType>>(
  () => null
)

export function DialogContextProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StateType>(initialState)
  return (
    <DialogContext.Provider value={state}>
      <DialogDispatchContext.Provider
        value={(type: ActionType) => {
          // A bit more complicated state management to allow us
          // to register multiple different types of the same dialog
          // and keep local "variant" until it's dismissed

          // ie, if there's no type provided, we fall back to whatever
          // previous state.type value was
          // and visibility is toggled
          setState({
            show: !type ? false : type !== state.type ? true : !state.show,
            type: !type ? state.type : type
          })
        }}
      >
        {children}
      </DialogDispatchContext.Provider>
    </DialogContext.Provider>
  )
}
