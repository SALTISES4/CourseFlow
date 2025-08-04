import useHover from '@cf/hooks/useHover'
import {
  addOutcome,
  deleteOutcome,
  duplicateOutcome
} from '@cf/redux/slices/outcomes.slice'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import NodeHoverMenu from '@cfComponents/UIPrimitives/NodeHoverMenu'
import { sidebarChangeTab, sidebarEdit } from '@cfRedux/slices/sidebar.slice'
import AddIcon from '@mui/icons-material/Add'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import ChatIcon from '@mui/icons-material/Chat'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteIcon from '@mui/icons-material/Delete'
import QueueIcon from '@mui/icons-material/Queue'
import RemoveIcon from '@mui/icons-material/Remove'
import { MouseEvent, MutableRefObject, useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Styled from '../../styles'

type PropsType = {
  id: number
  level: number
  title: string
  dragRef: MutableRefObject<HTMLDivElement>
  selected: boolean
  collapsed: boolean
  setCollapsed: (value: boolean) => void
  showToggle: boolean
  onClick: () => void
  onToggleClick: (e: MouseEvent<HTMLButtonElement>) => void
}

const OutcomeHeader = ({
  id,
  level,
  title,
  dragRef,
  selected,
  collapsed,
  setCollapsed,
  onClick,
  showToggle,
  onToggleClick
}: PropsType) => {
  const [, isHovered] = useHover(dragRef)

  return (
    <Styled.OutcomeHeader
      ref={dragRef}
      selected={selected}
      level={level}
      onClick={onClick}
    >
      <Styled.OutcomeHeaderInner>
        <Styled.OutcomeTitle variant="body2">{title}</Styled.OutcomeTitle>
        <HoverMenu
          show={isHovered}
          id={id}
          level={level}
          setCollapsed={setCollapsed}
        />
      </Styled.OutcomeHeaderInner>
      {showToggle && (
        <Styled.OutcomeHeaderToggle onClick={onToggleClick}>
          {collapsed ? (
            <AddIcon fontSize="small" />
          ) : (
            <RemoveIcon fontSize="small" />
          )}
        </Styled.OutcomeHeaderToggle>
      )}
    </Styled.OutcomeHeader>
  )
}

type HoverMenuActions =
  | 'insert-sibling'
  | 'insert-child'
  | 'duplicate'
  | 'delete'
  | 'comments'

const HoverMenu = ({
  id,
  level,
  show,
  setCollapsed
}: {
  id: PropsType['id']
  level: PropsType['level']
  show: boolean
  setCollapsed: PropsType['setCollapsed']
}) => {
  const dispatch = useDispatch()

  const onActionClick = useCallback(
    (action: HoverMenuActions) => {
      return (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        switch (action) {
          case 'insert-sibling':
            dispatch(addOutcome({ id, order: 'after' }))
            break
          case 'insert-child':
            dispatch(addOutcome({ id }))
            setCollapsed(false)
            break
          case 'duplicate':
            dispatch(duplicateOutcome(id))
            break
          case 'delete':
            dispatch(deleteOutcome(id))
            break
          case 'comments':
            dispatch(
              sidebarEdit({
                id,
                objectType: CfObjectType.OUTCOME,
                tab: 'comments'
              })
            )
            break
          default:
            break
        }
      }
    },
    [dispatch, setCollapsed, id]
  )

  return (
    <div>
      <NodeHoverMenu
        show={show}
        sx={{
          position: 'relative'
        }}
        items={[
          {
            label: 'Insert outcome below',
            icon: <AddCircleOutlineIcon />,
            onClick: onActionClick('insert-sibling')
          },
          level !== 3 && {
            label: 'Insert child outcome',
            icon: <QueueIcon />,
            onClick: onActionClick('insert-child')
          },
          {
            label: 'Duplicate outcome below',
            icon: <ContentCopyIcon />,
            onClick: onActionClick('duplicate')
          },
          {
            label: 'Delete outcome',
            icon: <DeleteIcon />,
            onClick: onActionClick('delete')
          },
          {
            label: 'Comments',
            icon: <ChatIcon />,
            onClick: onActionClick('comments')
          }
        ]}
      />
    </div>
  )
}

export default OutcomeHeader
