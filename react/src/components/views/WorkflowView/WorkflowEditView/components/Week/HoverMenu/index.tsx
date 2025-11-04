import { CfObjectType } from '@cf/types/enum'
import NodeHoverMenu from '@cfComponents/UIPrimitives/NodeHoverMenu'
import { sidebarEdit } from '@cfRedux/slices/sidebar.slice'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import ChatIcon from '@mui/icons-material/Chat'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import { MouseEvent, MutableRefObject, useCallback } from 'react'
import { useDispatch } from 'react-redux'

type PropsType = {
  weekId: number
  show: boolean
}

type HoverMenuActions = 'insert' | 'duplicate' | 'delete' | 'comments'

const HoverMenu = ({ weekId, show }: PropsType) => {
  const dispatch = useDispatch()

  const onActionClick = useCallback(
    (action: HoverMenuActions) => {
      return (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        switch (action) {
          case 'insert':
            console.log('insert week', weekId)
            break
          case 'duplicate':
            console.log('duplicate week', weekId)
            break
          case 'delete':
            console.log('delete week', weekId)
            break
          case 'comments':
            dispatch(
              sidebarEdit({
                id: weekId,
                objectType: CfObjectType.WEEK,
                tab: 'comments'
              })
            )
            break
          default:
            break
        }
      }
    },
    [dispatch, weekId]
  )

  return (
    <NodeHoverMenu
      sx={{ top: '0.7em', right: '4em' }}
      classNames="hover-menu"
      show={show}
      items={[
        {
          label: 'Insert week below',
          icon: <AddCircleOutlineIcon />,
          onClick: onActionClick('insert')
        },
        {
          label: 'Duplicate week below',
          icon: <ContentCopyIcon />,
          onClick: onActionClick('duplicate')
        },
        {
          label: 'Delete week',
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
