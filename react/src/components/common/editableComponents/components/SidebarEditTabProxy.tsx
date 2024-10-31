import useEditable from '@cfPages/Workspace/Workflow/Sidebar/hooks/useEditable'
import {
  EditableDataType,
  EditableType
} from '@cfPages/Workspace/Workflow/Sidebar/hooks/useEditable/types'
import { memo, useEffect } from 'react'

type PropsType = {
  id: number
}

// TODO: figure out the endpoint from which the data will be coming in
const getNodeData = (id: PropsType['id']) => {
  console.log('TODO: fetch data for node id', id)

  // figure out the node type
  const type = EditableType.PART

  // return the correct form shape for the corresponding node
  const data: EditableDataType<typeof type> = {
    title: 'hello',
    strategy: 1
  }

  return {
    type,
    data
  }
}

/**
 * Allows us to to interact with and use Workflow Sidebar hooks
  without having to refactor EditableComponent completely
  and allow for 'seamless' integration (hopefully)
 */
const SidebarEditTabProxy = memo(
  ({ id }: PropsType) => {
    const { setEditing } = useEditable()
    const { type, data } = getNodeData(id)

    // only run this once on mount, don't re-run when dependencies change
    useEffect(() => {
      setEditing(type, data)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return <></>
  },
  (prevProps, nextProps) => prevProps.id === nextProps.id
)

export default SidebarEditTabProxy
