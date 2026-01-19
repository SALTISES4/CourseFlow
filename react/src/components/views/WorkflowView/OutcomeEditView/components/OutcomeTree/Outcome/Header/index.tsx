import useHover from '@cf/hooks/useHover'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import NodeHoverMenu from '@cfComponents/UIPrimitives/NodeHoverMenu'
import editTabNodeData from '@cfPages/Workspace/Workflow/Sidebar/components/EditTab/components/EditNode/optionsData'
import {
  addOutcome,
  deleteOutcome,
  duplicateOutcome
} from '@cfRedux/slices/outcomes.slice'
import { sidebarEdit } from '@cfRedux/slices/sidebar.slice'
import AddIcon from '@mui/icons-material/Add'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import QueueIcon from '@mui/icons-material/Queue'
import RemoveIcon from '@mui/icons-material/Remove'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import { MouseEvent, MutableRefObject, useCallback } from 'react'
import { useDispatch } from 'react-redux'

import * as Styled from '../../styles'

// TODO: this actually needs to live somewhere else
const tagsData = editTabNodeData.tags

type PropsType = {
  id: number
  level: number
  title: string
  tags: number[]
  dragRef: MutableRefObject<HTMLDivElement>
  selected: boolean
  highlighted: boolean
  collapsed: boolean
  showToggle: boolean
  setCollapsed: (value: boolean) => void
  onClick: () => void
  onToggleClick: (e: MouseEvent<HTMLButtonElement>) => void
}

const OutcomeHeader = ({
  id,
  level,
  title,
  tags,
  dragRef,
  highlighted,
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
      highlighted={highlighted}
      selected={selected}
      level={level}
      onClick={onClick}
    >
      <Styled.OutcomeHeaderInner sx={{ position: 'relative' }}>
        <Styled.OutcomeTitle variant="body2">{title}</Styled.OutcomeTitle>
        {!!tags.length && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ marginRight: 1 }}
          >
            {tags.map((id) => (
              <Chip
                key={id}
                label={tagsData.find((t) => t.id === id).label}
                size="small"
                variant="outlined"
              />
            ))}
          </Stack>
        )}
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
    <NodeHoverMenu
      show={show}
      items={[
        {
          label: _t('Insert outcome below'),
          icon: <AddCircleOutlineIcon />,
          onClick: onActionClick('insert-sibling')
        },
        level !== 2 && {
          label: _t('Insert child outcome'),
          icon: <QueueIcon />,
          onClick: onActionClick('insert-child')
        },
        {
          label: _t('Duplicate outcome below'),
          icon: <ContentCopyIcon />,
          onClick: onActionClick('duplicate')
        },
        {
          label: _t('Delete outcome'),
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

export default OutcomeHeader
