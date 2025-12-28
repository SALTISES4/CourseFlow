import useHover from '@cf/hooks/useHover'
import {
  NodeInsertMode,
  nodeWorkflowDelete,
  nodeWorkflowInsert
} from '@cf/redux/slices/node.slice'
import { RootState } from '@cf/redux/store'
import { CfObjectType } from '@cf/types/enum'
import NodeHoverMenu from '@cfComponents/UIPrimitives/NodeHoverMenu'
import { sidebarEdit } from '@cfRedux/slices/sidebar.slice'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { MouseEvent, MutableRefObject, useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import InsertMenu from '../InsertMenu'

type PropsType = {
  nodeId: number
  nodeRef: MutableRefObject<HTMLDivElement>
}

type HoverMenuActions = 'insert' | 'duplicate' | 'delete' | 'comments'

type StateType = {
  anchor: HTMLDivElement | null
  duplicate?: boolean
}

const HoverMenu = ({ nodeId, nodeRef }: PropsType) => {
  const dispatch = useDispatch()
  const [state, setState] = useState<StateType>({
    anchor: null,
    duplicate: false
  })
  const [, hovering] = useHover(nodeRef)
  const insertMode = useSelector(
    (state: RootState) => state.workspace.node.insertMode
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
                nodeWorkflowInsert({
                  id: nodeId,
                  mode: insertMode,
                  duplicate: action === 'duplicate'
                })
              )
            }
            break
          case 'delete':
            dispatch(nodeWorkflowDelete({ id: nodeId }))
            break
          case 'comments':
            dispatch(
              sidebarEdit({
                id: nodeId,
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
    [dispatch, insertMode, nodeId, nodeRef]
  )

  const onInsertCancel = useCallback(
    () => setState({ anchor: null, duplicate: null }),
    []
  )

  const onInsertOption = useCallback(
    (insertModeOption: Exclude<NodeInsertMode, 'manual'>) => {
      dispatch(
        nodeWorkflowInsert({
          id: nodeId,
          mode: insertModeOption,
          duplicate: state.duplicate
        })
      )
      onInsertCancel()
    },
    [dispatch, onInsertCancel, nodeId, state.duplicate]
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
