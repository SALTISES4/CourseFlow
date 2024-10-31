import { useCallback, useContext, useMemo } from 'react'

import { EditableContext } from './context'
import { EditableDataType, EditableType } from './types'

export function useEditable() {
  const editable = useContext(EditableContext)

  const setEditing = useCallback(
    <T extends EditableType>(type: T | null, data?: EditableDataType<T>) => {
      if (!type) {
        editable.setEditing({ type: null, data: editable.data })
      } else {
        editable.setEditing({ type, data: data ?? editable.data })
      }
    },
    [editable]
  )

  return useMemo(
    () => ({
      ...editable,
      setEditing
    }),
    [editable, setEditing]
  )
}

export default useEditable
