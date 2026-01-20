import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { getNextLargestNumber } from '@cf/redux/selectors/helpers'
import { weekInsertBelow } from '@cf/redux/slices/week.slice'
import { RootState } from '@cf/redux/store'
import { CfObjectType } from '@cf/types/enum'
import NodeHoverMenu from '@cfComponents/UIPrimitives/NodeHoverMenu'
import { sidebarEdit } from '@cfRedux/slices/sidebar.slice'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { MouseEvent, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

type PropsType = {
  workflowId: number
  weekId: number
  show: boolean
}

type HoverMenuActions = 'insert' | 'duplicate' | 'delete' | 'comments'

const HoverMenu = ({ workflowId, weekId, show }: PropsType) => {
  const dispatch = useDispatch()
  const { dispatch: dialogDispatch } = useDialog()
  const ids = useSelector((state: RootState) => state.workspace.week.ids)
  const newWeekId = getNextLargestNumber(ids)

  const onActionClick = useCallback(
    (action: HoverMenuActions) => {
      return (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        switch (action) {
          case 'insert':
            dispatch(weekInsertBelow({ id: weekId, newId: newWeekId }))
            break
          case 'duplicate':
            dispatch(
              weekInsertBelow({ id: weekId, newId: newWeekId, duplicate: true })
            )
            break
          case 'delete':
            dialogDispatch(DialogMode.WORKFLOW_DELETE_SECTION, {
              sectionId: weekId,
              workflowId
            })
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
    [dispatch, dialogDispatch, newWeekId, weekId, workflowId]
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
