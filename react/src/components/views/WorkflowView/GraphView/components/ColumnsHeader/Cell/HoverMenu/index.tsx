import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import { insertChannelBelow } from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { sidebarEdit } from '@cf/features/sidebar/state/sidebar.slice'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import type { AppDispatch } from '@cf/redux/store'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import NodeHoverMenu from '@cfComponents/UIPrimitives/NodeHoverMenu'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { MouseEvent, useCallback } from 'react'
import { useDispatch } from 'react-redux'

type PropsType = {
  nodeId: string
  graphUuid: string
  show: boolean
}

type HoverMenuActions = 'insert' | 'duplicate' | 'delete' | 'comments'

const HoverMenu = ({ nodeId, graphUuid, show }: PropsType) => {
  const dispatch = useDispatch<AppDispatch>()
  const { dispatch: dialogDispatch } = useDialog()
  const canEdit = useResourcePermission(
    WorkflowPermission.NODE_CATEGORY_MANAGEMENT
  )
  const canComment = useResourcePermission(WorkflowPermission.COMMENT)

  const onActionClick = useCallback(
    (action: HoverMenuActions) => {
      return (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        switch (action) {
          case 'insert':
            dispatch(
              insertChannelBelow({
                graphUuid,
                channelUuid: nodeId,
                duplicate: false
              })
            )
            break
          case 'duplicate':
            dispatch(
              insertChannelBelow({
                graphUuid,
                channelUuid: nodeId,
                duplicate: true
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
    [dispatch, dialogDispatch, graphUuid, nodeId]
  )

  return (
    <NodeHoverMenu
      show={show}
      items={[
        canEdit && {
          label: _t('Insert right'),
          icon: <AddCircleOutlineIcon />,
          onClick: onActionClick('insert')
        },
        canEdit && {
          label: _t('Duplicate'),
          icon: <ContentCopyIcon />,
          onClick: onActionClick('duplicate')
        },
        canEdit && {
          label: _t('Delete'),
          icon: <DeleteOutlinedIcon />,
          onClick: onActionClick('delete')
        },
        canComment && {
          label: _t('Comments'),
          icon: <CommentOutlinedIcon />,
          onClick: onActionClick('comments')
        }
      ].filter(Boolean)}
    />
  )
}

export default HoverMenu
