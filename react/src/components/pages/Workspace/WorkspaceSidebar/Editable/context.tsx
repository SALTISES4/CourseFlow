import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useState
} from 'react'

import { EditablePropsType } from './types'

type ContextType = EditablePropsType & {
  setEditing: Dispatch<SetStateAction<EditablePropsType>>
}

const initialState: EditablePropsType = {
  type: null,
  data: null
}

export const EditableContext = createContext<ContextType>({
  ...initialState,
  setEditing: () => null
})

export const EditableContextProvider = ({
  children
}: {
  children: ReactNode
}) => {
  const [editing, setEditing] = useState(initialState)

  return (
    <EditableContext.Provider
      value={{
        ...editing,
        setEditing
      }}
    >
      {children}
    </EditableContext.Provider>
  )
}
