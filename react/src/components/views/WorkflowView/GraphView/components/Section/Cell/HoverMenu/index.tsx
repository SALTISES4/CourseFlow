import type { NodeInsertMode } from '@cf/features/graph/state/resolveNodeDropRow'
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
import { MouseEvent, MutableRefObject, useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import InsertMenu from '../InsertMenu'

type PropsType = {
  nodeId: string
  graphUuid: string
  nodeRef: MutableRefObject<HTMLDivElement>
}

type HoverMenuActions = 'insert' | 'duplicate' | 'delete' | 'comments'

type StateType = {
  anchor: HTMLDivElement | null
  duplicate?: boolean
}

const HoverMenu = ({ nodeId, graphUuid, nodeRef }: PropsType) => {
  const dispatch = useDispatch<AppDispatch>()
  const [state, setState] = useState<StateType>({
    anchor: null,
    duplicate: false
  })
  const [, hovering] = useHover(nodeRef)
  const insertMode = useSelector(
    (state: RootState) => state.graph.graphUi.nodeInsertMode
  )

  const onActionClick = useCallback(
    (action: HoverMenuActions) => {
      return (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
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
    [dispatch, graphUuid, insertMode, nodeId, nodeRef]
  )

  const onInsertCancel = useCallback(
    () => setState({ anchor: null, duplicate: null }),
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
      <InsertMenu
        anchorEl={state.anchor}
        onOption={onInsertOption}
        onClose={onInsertCancel}
      />
    </>
  )
}

export default HoverMenu
