import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { getNextLargestNumber } from '@cf/redux/selectors/helpers'
import { sectionInsertBelow } from '@cf/redux/slices/section.slice'
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
  workflowId: string
  sectionId: string
  show: boolean
}

type HoverMenuActions = 'insert' | 'duplicate' | 'delete' | 'comments'

const HoverMenu = ({ workflowId, sectionId, show }: PropsType) => {
  const dispatch = useDispatch()
  const { dispatch: dialogDispatch } = useDialog()
  const ids = useSelector((state: RootState) => state.workspace.section.uuids)
  // const newSectionId = getNextLargestNumber(ids)
  console.log('TODO: review section hover menu')
  const newSectionId = 'new-section-id'

  const onActionClick = useCallback(
    (action: HoverMenuActions) => {
      return (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        switch (action) {
          case 'insert':
            dispatch(
              sectionInsertBelow({ uuid: sectionId, newId: newSectionId })
            )
            break
          case 'duplicate':
            dispatch(
              sectionInsertBelow({
                uuid: sectionId,
                newId: newSectionId,
                duplicate: true
              })
            )
            break
          case 'delete':
            dialogDispatch(DialogMode.WORKFLOW_DELETE_SECTION, {
              sectionId: sectionId,
              workflowId
            })
            break
          case 'comments':
            dispatch(
              sidebarEdit({
                uuid: sectionId,
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
    [dispatch, dialogDispatch, newSectionId, sectionId, workflowId]
  )

  return (
    <NodeHoverMenu
      sx={{ top: '0.7em', right: '4em' }}
      classNames="hover-menu"
      show={show}
      items={[
        {
          label: 'Insert section below',
          icon: <AddCircleOutlineIcon />,
          onClick: onActionClick('insert')
        },
        {
          label: 'Duplicate section below',
          icon: <ContentCopyIcon />,
          onClick: onActionClick('duplicate')
        },
        {
          label: 'Delete section',
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
