import { CfObjectType } from '@cf/types/enum'
import NodeHoverMenu from '@cfComponents/UIPrimitives/NodeHoverMenu'
import { sidebarEdit } from '@cfRedux/slices/sidebar.slice'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { MouseEvent, useCallback } from 'react'
import { useDispatch } from 'react-redux'

type PropsType = {
  nodeId: number
  show: boolean
}

type HoverMenuActions = 'insert' | 'duplicate' | 'delete' | 'comments'

const HoverMenu = ({ nodeId, show }: PropsType) => {
  const dispatch = useDispatch()

  const onActionClick = useCallback(
    (action: HoverMenuActions) => {
      return (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        switch (action) {
          case 'insert':
            console.log('insert column', nodeId)
            break
          case 'duplicate':
            console.log('duplicate column', nodeId)
            break
          case 'delete':
            console.log('delete column', nodeId)
            break
          case 'comments':
            dispatch(
              sidebarEdit({
                id: nodeId,
                objectType: CfObjectType.COLUMN,
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
      show={show}
      items={[
        {
          label: 'Insert below',
          icon: <AddCircleOutlineIcon />,
          onClick: onActionClick('insert')
        },
        {
          label: 'Duplicate',
          icon: <ContentCopyIcon />,
          onClick: onActionClick('duplicate')
        },
        {
          label: 'Delete',
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
