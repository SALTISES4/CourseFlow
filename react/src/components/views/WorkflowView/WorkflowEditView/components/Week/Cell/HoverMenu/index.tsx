import useHover from '@cf/hooks/useHover'
import {
  nodeWorkflowDelete,
  nodeWorkflowInsert
} from '@cf/redux/slices/node.slice'
import { CfObjectType } from '@cf/types/enum'
import NodeHoverMenu from '@cfComponents/UIPrimitives/NodeHoverMenu'
import { sidebarEdit } from '@cfRedux/slices/sidebar.slice'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { MouseEvent, MutableRefObject, useCallback } from 'react'
import { useDispatch } from 'react-redux'

type PropsType = {
  nodeId: number
  nodeRef: MutableRefObject<HTMLDivElement>
}

type HoverMenuActions = 'insert' | 'duplicate' | 'delete' | 'comments'

const HoverMenu = ({ nodeId, nodeRef }: PropsType) => {
  const dispatch = useDispatch()
  const [, hovering] = useHover(nodeRef)

  const onActionClick = useCallback(
    (action: HoverMenuActions) => {
      return (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        switch (action) {
          case 'insert':
            dispatch(nodeWorkflowInsert({ id: nodeId }))
            break
          case 'duplicate':
            dispatch(nodeWorkflowInsert({ id: nodeId, duplicate: true }))
            break
          case 'delete':
            dispatch(nodeWorkflowDelete({ id: nodeId }))
            break
          case 'comments':
            dispatch(
              sidebarEdit({
                id: nodeId,
                objectType: CfObjectType.NODE,
                tab: 'comments'
              })
            )
            break
          default:
            break
        }
      }
    },
    [dispatch, nodeId]
  )

  return (
    <NodeHoverMenu
      show={hovering}
      items={[
        {
          label: 'Insert node below',
          icon: <AddCircleOutlineIcon />,
          onClick: onActionClick('insert')
        },
        {
          label: 'Duplicate node below',
          icon: <ContentCopyIcon />,
          onClick: onActionClick('duplicate')
        },
        {
          label: 'Delete node',
          icon: <DeleteOutlinedIcon />,
          onClick: onActionClick('delete')
        },
        {
          label: 'Comments',
          icon: <CommentOutlinedIcon />,
          onClick: onActionClick('comments')
        }
      ]}
    />
  )
}

export default HoverMenu
