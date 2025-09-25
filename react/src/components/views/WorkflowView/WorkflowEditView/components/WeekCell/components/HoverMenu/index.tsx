import { sidebarEdit } from '@cfRedux/slices/sidebar.slice'
import { CfObjectType } from '@cf/types/enum'
import NodeHoverMenu from '@cfComponents/UIPrimitives/NodeHoverMenu'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import ChatIcon from '@mui/icons-material/Chat'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import { MouseEvent, useCallback } from 'react'
import { useDispatch } from 'react-redux'

type PropsType = {
  id: number
  show: boolean
}

type HoverMenuActions = 'insert' | 'duplicate' | 'delete' | 'comments'

const HoverMenu = ({ id, show }: PropsType) => {
  const dispatch = useDispatch()

  const onActionClick = useCallback(
    (action: HoverMenuActions) => {
      return (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        switch (action) {
          case 'insert':
            console.log('insert')
            break
          case 'duplicate':
            console.log('duplicate')
            break
          case 'delete':
            console.log('delete')
            break
          case 'comments':
            dispatch(
              sidebarEdit({
                id,
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
    [dispatch, id]
  )

  return (
    <NodeHoverMenu
      show={show}
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
          icon: <DeleteIcon />,
          onClick: onActionClick('delete')
        },
        {
          label: 'Comments',
          icon: <ChatIcon />,
          onClick: onActionClick('comments')
        }
      ]}
    />
  )
}

export default HoverMenu
