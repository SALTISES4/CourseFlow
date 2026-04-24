import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { getNextLargestNumber } from '@cf/redux/selectors/helpers'
import { columnInsertBelow } from '@cf/redux/slices/column.slice'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import NodeHoverMenu from '@cfComponents/UIPrimitives/NodeHoverMenu'
import { sidebarEdit } from '@cfRedux/slices/sidebar.slice'
import { RootState } from '@cfRedux/store'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { MouseEvent, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

type PropsType = {
  nodeId: string
  show: boolean
}

type HoverMenuActions = 'insert' | 'duplicate' | 'delete' | 'comments'

const HoverMenu = ({ nodeId, show }: PropsType) => {
  const dispatch = useDispatch()
  const { dispatch: dialogDispatch } = useDialog()
  const ids = useSelector((state: RootState) => state.workspace.column.ids)
  // const newColumnId = getNextLargestNumber(ids)
  const newColumnId = 'please-work-god'

  const onActionClick = useCallback(
    (action: HoverMenuActions) => {
      return (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        switch (action) {
          case 'insert':
            dispatch(columnInsertBelow({ id: nodeId, newId: newColumnId }))
            break
          case 'duplicate':
            dispatch(
              columnInsertBelow({
                id: nodeId,
                newId: newColumnId,
                duplicate: nodeId
              })
            )
            break
          case 'delete':
            dialogDispatch(DialogMode.WORKFLOW_DELETE_NODE_CATEGORY, {
              id: nodeId
            })
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
    [dispatch, dialogDispatch, newColumnId, nodeId]
  )

  return (
    <NodeHoverMenu
      show={show}
      items={[
        {
          label: _t('Insert right'),
          icon: <AddCircleOutlineIcon />,
          onClick: onActionClick('insert')
        },
        {
          label: _t('Duplicate'),
          icon: <ContentCopyIcon />,
          onClick: onActionClick('duplicate')
        },
        {
          label: _t('Delete'),
          icon: <DeleteOutlinedIcon />,
          onClick: onActionClick('delete')
        },
        {
          label: _t('Comments'),
          icon: <CommentOutlinedIcon />,
          onClick: onActionClick('comments')
        }
      ]}
    />
  )
}

export default HoverMenu
