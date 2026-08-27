import { WorkflowPermission } from '@cf/api/gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import type { GraphUuid } from '@cf/features/graph/state/model/types'
import { selectOutcomeById } from '@cf/features/graph/state/selectors/outcomes.selectors'
import { selectThreadCommentCount } from '@cf/features/graph/state/selectors/threadCommentCounts.selectors'
import {
  createOutcome,
  deleteOutcome,
  duplicateOutcome
} from '@cf/features/graph/state/thunks/outcomeMutations.thunks'
import { useGraphProjectTags } from '@cf/features/graph/useGraphProjectTags'
import { sidebarEdit } from '@cf/features/sidebar/state/sidebar.slice'
import useHover from '@cf/hooks/useHover'
import { RootState } from '@cf/redux/store'
import type { AppDispatch } from '@cf/redux/store'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import NodeHoverMenu from '@cfComponents/UIPrimitives/NodeHoverMenu'
import AddIcon from '@mui/icons-material/Add'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import QueueIcon from '@mui/icons-material/Queue'
import RemoveIcon from '@mui/icons-material/Remove'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import { MouseEvent, RefObject, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Styled from '../../styles'

type PropsType = {
  graphUuid: GraphUuid
  uuid: string
  level: number
  title: string
  tags: number[]
  dragRef: RefObject<HTMLDivElement>
  selected: boolean
  highlighted: boolean
  collapsed: boolean
  showToggle: boolean
  setCollapsed: (value: boolean) => void
  onClick: () => void
  onToggleClick: (e: MouseEvent<HTMLButtonElement>) => void
  greenHover?: boolean
}

const OutcomeHeader = ({
  graphUuid,
  uuid,
  level,
  title,
  tags,
  dragRef,
  highlighted,
  selected,
  collapsed,
  greenHover,
  setCollapsed,
  onClick,
  showToggle,
  onToggleClick
}: PropsType) => {
  const [, isHovered] = useHover(dragRef)
  const { data: projectTags = [] } = useGraphProjectTags(graphUuid)

  return (
    <Styled.OutcomeHeader
      ref={dragRef}
      highlighted={highlighted}
      selected={selected}
      level={level}
      onClick={onClick}
      greenHover={greenHover}
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
                label={projectTags.find((tag) => tag.id === id)?.label ?? id}
                size="small"
                variant="outlined"
              />
            ))}
          </Stack>
        )}
        <HoverMenu
          show={isHovered}
          graphUuid={graphUuid}
          uuid={uuid}
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
  graphUuid,
  uuid,
  level,
  show,
  setCollapsed
}: {
  graphUuid: GraphUuid
  uuid: PropsType['uuid']
  level: PropsType['level']
  show: boolean
  setCollapsed: PropsType['setCollapsed']
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const canManageOutcomes = useResourcePermission(
    WorkflowPermission.OUTCOME_MANAGEMENT
  )
  const canComment = useResourcePermission(WorkflowPermission.COMMENT)
  const sibling = useSelector((state: RootState) =>
    selectOutcomeById(state, uuid)
  )
  const commentCount = useSelector((state: RootState) =>
    selectThreadCommentCount(state, sibling?.threadUuid)
  )
  const canInsertChild = level < 2

  const onActionClick = useCallback(
    (action: HoverMenuActions) => {
      return (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        if (action !== 'comments' && !canManageOutcomes) {
          return
        }
        switch (action) {
          case 'insert-sibling':
            if (sibling) {
              dispatch(
                createOutcome({
                  graphUuid,
                  parentUuid: sibling.parentUuid,
                  insertIndex: sibling.order + 1
                })
              )
            }
            break
          case 'insert-child':
            if (canInsertChild) {
              dispatch(
                createOutcome({
                  graphUuid,
                  parentUuid: uuid
                })
              )
              setCollapsed(false)
            }
            break
          case 'duplicate':
            dispatch(
              duplicateOutcome({
                graphUuid,
                outcomeUuid: uuid
              })
            )
            break
          case 'delete':
            dispatch(
              deleteOutcome({
                graphUuid,
                outcomeUuid: uuid
              })
            )
            break
          case 'comments':
            dispatch(
              sidebarEdit({
                uuid,
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
    [
      canInsertChild,
      canManageOutcomes,
      dispatch,
      graphUuid,
      setCollapsed,
      sibling,
      uuid
    ]
  )

  return (
    <NodeHoverMenu
      show={show}
      items={[
        {
          label: _t('Insert sibling'),
          icon: <AddCircleOutlineIcon />,
          onClick: onActionClick('insert-sibling'),
          disabled: !canManageOutcomes
        },
        canInsertChild && {
          label: _t('Insert child'),
          icon: <QueueIcon />,
          onClick: onActionClick('insert-child'),
          disabled: !canManageOutcomes
        },
        {
          label: _t('Duplicate'),
          icon: <ContentCopyIcon />,
          onClick: onActionClick('duplicate'),
          disabled: !canManageOutcomes
        },
        canComment && {
          label: _t('Comments'),
          icon: <CommentOutlinedIcon />,
          showCommentsPresenceIndicator: commentCount > 0,
          onClick: onActionClick('comments')
        },
        {
          label: _t('Delete'),
          icon: <DeleteOutlinedIcon />,
          onClick: onActionClick('delete'),
          disabled: !canManageOutcomes
        }
      ].filter((item) => item && (canManageOutcomes || canComment))}
    />
  )
}

export default OutcomeHeader
