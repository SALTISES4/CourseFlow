import { useContext } from 'react'

import { EditableContext } from './context'
import { EditableDataType, EditableType } from './types'

export function useEditable() {
  const editable = useContext(EditableContext)

  return {
    ...editable,
    setEditing: <T extends EditableType>(
      type: T | null,
      data?: EditableDataType<T>
    ) => {
      if (!type) {
        editable.setEditing({ type: null, data: editable.data })
      } else {
        editable.setEditing({ type, data: data ?? editable.data })
      }
    }
  }
}

export default useEditable
