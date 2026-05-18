import { insertSectionBelow } from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { sidebarEdit } from '@cf/features/sidebar/state/sidebar.slice'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import type { AppDispatch } from '@cf/redux/store'
import { CfObjectType } from '@cf/types/enum'
import NodeHoverMenu from '@cfComponents/UIPrimitives/NodeHoverMenu'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { MouseEvent, useCallback } from 'react'
import { useDispatch } from 'react-redux'

type PropsType = {
  graphUuid: string
  sectionId: string
  show: boolean
}

type HoverMenuActions = 'insert' | 'duplicate' | 'delete' | 'comments'

const HoverMenu = ({ graphUuid, sectionId, show }: PropsType) => {
  const dispatch = useDispatch<AppDispatch>()
  const { dispatch: dialogDispatch } = useDialog()

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
