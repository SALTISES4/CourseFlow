import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import { selectSectionCount } from '@cf/features/graph/state/selectors/canonical.selectors'
import { selectThreadCommentCount } from '@cf/features/graph/state/selectors/threadCommentCounts.selectors'
import { insertSectionBelow } from '@cf/features/graph/state/thunks/graphMutations.thunks'
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

type PropsType = {
  graphUuid: string
  sectionId: string
  show: boolean
  threadUuid: string | null
}

type HoverMenuActions = 'insert' | 'duplicate' | 'delete' | 'comments'

const HoverMenu = ({ graphUuid, sectionId, show, threadUuid }: PropsType) => {
  const totalSectionCount = useSelector(selectSectionCount)
  const dispatch = useDispatch<AppDispatch>()
  const { dispatch: dialogDispatch } = useDialog()
  const canEdit = useResourcePermission(WorkflowPermission.PART_MANAGEMENT)
  const canComment = useResourcePermission(WorkflowPermission.COMMENT)
  const commentCount = useSelector((state: RootState) =>
    selectThreadCommentCount(state, threadUuid)
  )

  const onActionClick = useCallback(
    (action: HoverMenuActions) => {
      return (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        switch (action) {
          case 'insert':
            dispatch(
              insertSectionBelow({
                graphUuid,
                sectionUuid: sectionId,
                duplicate: false
              })
            )
            break
          case 'duplicate':
            dispatch(
              insertSectionBelow({
                graphUuid,
                sectionUuid: sectionId,
                duplicate: true
              })
            )
            break
          case 'delete':
            dialogDispatch(DialogMode.GRAPH_DELETE_SECTION, {
              sectionId: sectionId,
              graphUuid
            })
            break
          case 'comments':
            dispatch(
              sidebarEdit({
                uuid: sectionId,
                objectType: CfObjectType.SECTION,
                tab: 'comments'
              })
            )
            break
          default:
            break
        }
      }
    },
    [dispatch, dialogDispatch, graphUuid, sectionId]
  )

  return (
    <NodeHoverMenu
      sx={{ top: '0.7em', right: '4em' }}
      classNames="hover-menu"
      data-test-id="workflow-section-hover-menu"
      show={show}
      items={[
        canEdit && {
          label: 'Insert section below',
          icon: <AddCircleOutlineIcon />,
          onClick: onActionClick('insert')
        },
        canEdit && {
          label: 'Duplicate section below',
          icon: <ContentCopyIcon />,
          onClick: onActionClick('duplicate')
        },
        canEdit && {
          label: 'Delete section',
          icon: <DeleteOutlinedIcon />,
          onClick: onActionClick('delete'),
          disabled: totalSectionCount <= 1
        },
        canComment && {
          label: 'Comments',
          icon: <CommentOutlinedIcon />,
          showCommentsPresenceIndicator: commentCount > 0,
          onClick: onActionClick('comments')
        }
      ].filter(Boolean)}
    />
  )
}

export default HoverMenu
