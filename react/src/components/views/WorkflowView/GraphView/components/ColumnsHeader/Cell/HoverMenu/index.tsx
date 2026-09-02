import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import { selectThreadCommentCount } from '@cf/features/graph/state/selectors/threadCommentCounts.selectors'
import { insertChannelBelow } from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { sidebarEdit } from '@cf/features/sidebar/state/sidebar.slice'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import type { AppDispatch, RootState } from '@cf/redux/store'
import { CfObjectType } from '@cf/types/enum'
import NodeHoverMenu from '@cfComponents/UIPrimitives/NodeHoverMenu'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { MouseEvent, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

type PropsType = {
  nodeId: string
  graphUuid: string
  show: boolean
  threadUuid: string | null
}

type HoverMenuActions = 'insert' | 'duplicate' | 'delete' | 'comments'

const HoverMenu = ({ nodeId, graphUuid, show, threadUuid }: PropsType) => {
  const { t } = useTranslation(['workflow', 'common'])
  const dispatch = useDispatch<AppDispatch>()
  const { dispatch: dialogDispatch } = useDialog()
  const canEdit = useResourcePermission(
    WorkflowPermission.NODE_CATEGORY_MANAGEMENT
  )
  const canComment = useResourcePermission(WorkflowPermission.COMMENT)
  const commentCount = useSelector((state: RootState) =>
    selectThreadCommentCount(state, threadUuid)
  )

  const onActionClick = useCallback(
    (action: HoverMenuActions) => {
      return (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        if (action !== 'comments' && !canEdit) {
          return
        }
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
    [canEdit, dispatch, dialogDispatch, graphUuid, nodeId]
  )

  return (
    <NodeHoverMenu
      show={show}
      sx={{ top: '-16px' }}
      items={[
        {
          label: t('workflow:graph.insertRight'),
          icon: <AddCircleOutlineIcon />,
          onClick: onActionClick('insert'),
          disabled: !canEdit
        },
        {
          label: t('common:actions.duplicate'),
          icon: <ContentCopyIcon />,
          onClick: onActionClick('duplicate'),
          disabled: !canEdit
        },
        {
          label: t('common:actions.delete'),
          icon: <DeleteOutlinedIcon />,
          onClick: onActionClick('delete'),
          disabled: !canEdit
        },
        canComment && {
          label: t('workflow:comments.title'),
          icon: <CommentOutlinedIcon />,
          showCommentsPresenceIndicator: commentCount > 0,
          onClick: onActionClick('comments')
        }
      ].filter((item) => item && (canEdit || canComment))}
    />
  )
}

export default HoverMenu
