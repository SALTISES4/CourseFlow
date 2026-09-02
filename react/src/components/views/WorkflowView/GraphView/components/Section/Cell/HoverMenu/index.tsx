import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import type { NodeInsertMode } from '@cf/features/graph/state/resolveNodeDropRow'
import { selectThreadCommentCount } from '@cf/features/graph/state/selectors/threadCommentCounts.selectors'
import {
  deleteNode,
  insertNodeBelow
} from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { sidebarEdit } from '@cf/features/sidebar/state/sidebar.slice'
import useHover from '@cf/hooks/useHover'
import type { AppDispatch, RootState } from '@cf/redux/store'
import { CfObjectType } from '@cf/types/enum'
import NodeHoverMenu from '@cfComponents/UIPrimitives/NodeHoverMenu'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { MouseEvent, RefObject, useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import InsertMenu from '../InsertMenu'

type PropsType = {
  nodeId: string
  graphUuid: string
  nodeRef: RefObject<HTMLDivElement>
  threadUuid: string | null
}

type HoverMenuActions = 'insert' | 'duplicate' | 'delete' | 'comments'

type StateType = {
  anchor: HTMLDivElement | null
  duplicate?: boolean
}

const HoverMenu = ({ nodeId, graphUuid, nodeRef, threadUuid }: PropsType) => {
  const { t } = useTranslation('workflow')
  const dispatch = useDispatch<AppDispatch>()
  const [state, setState] = useState<StateType>({
    anchor: null,
    duplicate: false
  })
  const [, hovering] = useHover(nodeRef)
  const insertMode = useSelector(
    (state: RootState) => state.graph.graphUi.nodeInsertMode
  )
  const canEdit = useResourcePermission(WorkflowPermission.NODE_MANAGEMENT)
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
          case 'duplicate':
            if (insertMode === 'manual') {
              setState({
                anchor: nodeRef?.current,
                duplicate: action === 'duplicate'
              })
            } else {
              dispatch(
                insertNodeBelow({
                  graphUuid,
                  nodeUuid: nodeId,
                  mode: insertMode,
                  duplicate: action === 'duplicate'
                })
              )
            }
            break
          case 'delete':
            dispatch(
              deleteNode({
                graphUuid,
                nodeUuid: nodeId
              })
            )
            break
          case 'comments':
            dispatch(
              sidebarEdit({
                uuid: nodeId,
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
    [canEdit, dispatch, graphUuid, insertMode, nodeId, nodeRef]
  )

  const onInsertCancel = useCallback(
    () => setState({ anchor: null, duplicate: undefined }),
    []
  )

  const onInsertOption = useCallback(
    (insertModeOption: Exclude<NodeInsertMode, 'manual'>) => {
      dispatch(
        insertNodeBelow({
          graphUuid,
          nodeUuid: nodeId,
          mode: insertModeOption,
          duplicate: state.duplicate
        })
      )
      onInsertCancel()
    },
    [dispatch, graphUuid, nodeId, onInsertCancel, state.duplicate]
  )

  return (
    <>
      <NodeHoverMenu
        show={hovering}
        sx={{ top: '-16px' }}
        items={[
          {
            label: t('graph.insertNodeBelow'),
            icon: <AddCircleOutlineIcon />,
            onClick: onActionClick('insert'),
            disabled: !canEdit
          },
          {
            label: t('graph.duplicateNodeBelow'),
            icon: <ContentCopyIcon />,
            onClick: onActionClick('duplicate'),
            disabled: !canEdit
          },
          {
            label: t('graph.deleteNode'),
            icon: <DeleteOutlinedIcon />,
            onClick: onActionClick('delete'),
            disabled: !canEdit
          },
          canComment && {
            label: t('comments.title'),
            icon: <CommentOutlinedIcon />,
            showCommentsPresenceIndicator: commentCount > 0,
            onClick: onActionClick('comments')
          }
        ].filter((item) => item && (canEdit || canComment))}
      />
      <InsertMenu
        anchorEl={state.anchor}
        onOption={onInsertOption}
        onClose={onInsertCancel}
      />
    </>
  )
}

export default HoverMenu
