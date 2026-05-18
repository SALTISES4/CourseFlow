import { sidebarEdit } from '@cf/features/sidebar/state/sidebar.slice'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { columnInsertBelow } from '@cf/redux/slices/column.slice'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import NodeHoverMenu from '@cfComponents/UIPrimitives/NodeHoverMenu'
import { RootState } from '@cfRedux/store'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { MouseEvent, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

type PropsType = {
  nodeId: string
  graphUuid: string
  show: boolean
}

type HoverMenuActions = 'insert' | 'duplicate' | 'delete' | 'comments'

const HoverMenu = ({ nodeId, graphUuid, show }: PropsType) => {
  const dispatch = useDispatch()
  const { dispatch: dialogDispatch } = useDialog()
  const ids = useSelector((state: RootState) => {
    const st = state as RootState & {
      workspace?: { column?: { uuids?: string[] } }
    }
    return st.workspace?.column?.uuids ?? []
  })
  // const newColumnId = Utility.getNextLargestNumber(ids)
  const newColumnId = 'please-work-god'

  const onActionClick = useCallback(
    (action: HoverMenuActions) => {
      return (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        switch (action) {
          case 'insert':
            dispatch(columnInsertBelow({ uuid: nodeId, newId: newColumnId }))
            break
          case 'duplicate':
            dispatch(
              columnInsertBelow({
                uuid: nodeId,
                newId: newColumnId,
                duplicate: nodeId
              })
            )
            break
          case 'delete':
            dialogDispatch(DialogMode.WORKFLOW_DELETE_NODE_CATEGORY, {
              uuid: nodeId,
              graphUuid
            })
            break
          case 'comments':
            dispatch(
              sidebarEdit({
                uuid: nodeId,
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
    [dispatch, dialogDispatch, graphUuid, newColumnId, nodeId]
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
