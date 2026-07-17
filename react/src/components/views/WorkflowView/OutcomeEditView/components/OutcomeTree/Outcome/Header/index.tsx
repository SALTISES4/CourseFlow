import { WorkflowPermission } from '@cf/api/gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import type { GraphUuid } from '@cf/features/graph/state/model/types'
import { selectOutcomeById } from '@cf/features/graph/state/selectors/outcomes.selectors'
import {
  createOutcome,
  deleteOutcome,
  duplicateOutcome
} from '@cf/features/graph/state/thunks/outcomeMutations.thunks'
import { sidebarEdit } from '@cf/features/sidebar/state/sidebar.slice'
import useHover from '@cf/hooks/useHover'
import { RootState } from '@cf/redux/store'
import type { AppDispatch } from '@cf/redux/store'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import NodeHoverMenu from '@cfComponents/UIPrimitives/NodeHoverMenu'
import editTabNodeData from '@cfSidebar/components/EditTab/components/EditNode/optionsData'
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

const tagsData = editTabNodeData.tags

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
                label={tagsData.find((t) => t.uuid === id)?.label ?? id}
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

  const onActionClick = useCallback(
    (action: HoverMenuActions) => {
      return (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
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
            dispatch(
              createOutcome({
                graphUuid,
                parentUuid: uuid
              })
            )
            setCollapsed(false)
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
    [dispatch, graphUuid, setCollapsed, sibling, uuid]
  )

  return (
    <NodeHoverMenu
      show={show}
      items={[
        canManageOutcomes && {
          label: _t('Insert sibling'),
          icon: <AddCircleOutlineIcon />,
          onClick: onActionClick('insert-sibling')
        },
        canManageOutcomes && {
          label: _t('Insert child'),
          icon: <QueueIcon />,
          onClick: onActionClick('insert-child')
        },
        canManageOutcomes && {
          label: _t('Duplicate'),
          icon: <ContentCopyIcon />,
          onClick: onActionClick('duplicate')
        },
        canComment && {
          label: _t('Comments'),
          icon: <CommentOutlinedIcon />,
          onClick: onActionClick('comments')
        },
        canManageOutcomes && {
          label: _t('Delete'),
          icon: <DeleteOutlinedIcon />,
          onClick: onActionClick('delete')
        }
      ].filter(Boolean)}
    />
  )
}

export default OutcomeHeader
