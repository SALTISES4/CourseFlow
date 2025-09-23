import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import useHover from '@cf/hooks/useHover'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import { HoverMenu, MenuItemType } from '@cfComponents/menu/Menu'
import { selectNodeById } from '@cfRedux/selectors/node.selector'
import { RootState } from '@cfRedux/store'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import DeleteIcon from '@mui/icons-material/Delete'
import DragHandleIcon from '@mui/icons-material/DragHandle'
import QueueIcon from '@mui/icons-material/Queue'
import {
  useCreateNodeMutation,
  useDeleteNodeMutation
} from '@XMLHTTP/API/workflowObjects/node.rtk'
import mergeRefs from 'merge-refs'
import { Ref } from 'react'
import { useSelector } from 'react-redux'

import Node from './Node'
import * as Styled from '../../styles'
import DroppableCell from '../DroppableCell'

type PropsType = {
  objectId: number
  parentId: number
  row: number
}

/**
 * NodeWrapper:
 * only purpose now is (maybe) as a  wrapper for drag and drop
 * (although make droppable is still in Node right now)
 * this is why we just call getNodeById in both NodeWrapper and child
 * TBD...
 **/

const NodeHoverMenu = ({
  objectId,
  show
}: {
  objectId: number
  show: boolean
}) => {
  /*******************************************************
   * API HOOKS
   *******************************************************/
  const { onError, onSuccess } = useGenericMsgHandler()

  const [
    createMutate,
    { isSuccess: createSuccess, isError: createError, data: createData }
  ] = useCreateNodeMutation()

  const [
    deleteMutate,
    { isSuccess: deleteSuccess, isError: deleteError, data: deleteData }
  ] = useDeleteNodeMutation()

  const createButtonHandler = async (type: CfObjectType) => {
    try {
      console.log('creating type', type)
      const resp = await createMutate({
        payload: {
          objectType: type
        }
      }).unwrap()
      onSuccess(resp)
    } catch (e) {
      onError(e)
    }
  }

  const deleteButtonHandler = async () => {
    try {
      const resp = await deleteMutate({
        id: objectId
      }).unwrap()
      onSuccess(resp)
    } catch (e) {
      onError(e)
    }
  }

  const menuItems: MenuItemType[] = [
    {
      content: _t('Delete'),
      action: () => deleteButtonHandler(),
      icon: <DeleteIcon />,
      show: true
    },
    {
      content: _t('Insert new'),
      action: () => createButtonHandler(CfObjectType.WEEK),
      icon: <QueueIcon />,
      show: true
    }
  ]

  if (!show) {
    return <></>
  }

  return (
    <>
      <HoverMenu
        id="hover-menu"
        data-test-id="hover-menu"
        menuItems={menuItems}
      />
    </>
  )
}

const NodeWrapper = ({ objectId, parentId, row }: PropsType) => {
  const [ref, isHovered] = useHover()

  // review the node name / data
  const node = useSelector((state: RootState) =>
    selectNodeById(state, objectId)
  )
  const workflow = useSelector((state: RootState) => state.workspace.workflow)
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: objectId })

  if (!node) {
    return null
  }

  return workflow.columns.map((column) => (
    <DroppableCell
      key={column}
      groupId={parentId}
      coords={{
        row,
        column
      }}
    >
      <Styled.Cell>
        <Styled.DebugCellInfo>
          row: {row}, col: {column}
        </Styled.DebugCellInfo>

        {column === node.column && (
          <div
            id={String(objectId)}
            className="node-week"
            ref={mergeRefs(setNodeRef as Ref<HTMLDivElement>, ref)}
            style={{
              position: 'relative',
              transform: CSS.Transform.toString(transform),
              transition
            }}
            {...attributes}
            data-child-id={String(objectId)}
            data-column-id={String(node.column)}
          >
            <div {...listeners}>
              <DragHandleIcon />
            </div>

            <Node objectId={objectId} parentId={parentId} />

            <NodeHoverMenu objectId={objectId} show={isHovered} />
          </div>
        )}
      </Styled.Cell>
    </DroppableCell>
  ))
}

export default NodeWrapper
