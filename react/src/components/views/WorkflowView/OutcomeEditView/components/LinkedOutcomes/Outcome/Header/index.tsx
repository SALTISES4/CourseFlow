import { unlinkNodeOutcome } from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { sidebarEdit } from '@cf/features/sidebar/state/sidebar.slice'
import useHover from '@cf/hooks/useHover'
import type { AppDispatch } from '@cf/redux/store'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import NodeHoverMenu from '@cfComponents/UIPrimitives/NodeHoverMenu'
import { linkOutcome } from '@cfRedux/slices/outcomes.slice'
import { LinkedOutcomesPropsType } from '@cfViews/WorkflowView/OutcomeEditView/components/LinkedOutcomes/types'
import * as Styled from '@cfViews/WorkflowView/OutcomeEditView/components/OutcomeTree/styles'
import AddIcon from '@mui/icons-material/Add'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import CommentOutlinedIcon from '@mui/icons-material/CommentOutlined'
import RemoveIcon from '@mui/icons-material/Remove'
import { MouseEvent, MutableRefObject, useCallback } from 'react'
import { useDispatch } from 'react-redux'

type PropsType = {
  uuid: string
  level: number
  linkParent?: LinkedOutcomesPropsType['parent']
  title: string
  dragRef: MutableRefObject<HTMLDivElement>
  selected: boolean
  collapsed: boolean
  showToggle: boolean
  onToggleClick: (e: MouseEvent<HTMLButtonElement>) => void
}

const OutcomeHeader = ({
  uuid,
  level,
  linkParent,
  title,
  dragRef,
  collapsed,
  showToggle,
  onToggleClick
}: PropsType) => {
  const [, isHovered] = useHover(dragRef)

  return (
    <Styled.OutcomeHeader
      ref={dragRef}
      level={level}
      sx={{
        '&:hover': {
          boxShadow: 'none',
          cursor: 'default'
        }
      }}
    >
      <Styled.OutcomeHeaderInner>
        <Styled.OutcomeTitle variant="body2">{title}</Styled.OutcomeTitle>
        <HoverMenu show={isHovered} uuid={uuid} linkParent={linkParent} />
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

enum HoverMenuActions {
  UNLINK = 'unlink',
  COMMENTS = 'comments'
}

const HoverMenu = ({
  uuid,
  linkParent,
  show
}: {
  uuid: PropsType['uuid']
  linkParent: PropsType['linkParent']
  show: boolean
}) => {
  const dispatch = useDispatch<AppDispatch>()

  const onActionClick = useCallback(
    (action: HoverMenuActions) => {
      return (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        switch (action) {
          case HoverMenuActions.UNLINK:
            switch (linkParent.type) {
              case 'outcome':
                dispatch(
                  linkOutcome({
                    targetId: uuid,
                    destinationId: linkParent.uuid
                  })
                )
                break
              case 'node':
                if (linkParent.graphUuid) {
                  void dispatch(
                    unlinkNodeOutcome({
                      graphUuid: linkParent.graphUuid,
                      nodeUuid: linkParent.uuid,
                      outcomeUuid: uuid
                    })
                  )
                }
                break
            }
            break
          case HoverMenuActions.COMMENTS:
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
    [dispatch, uuid, linkParent]
  )

  return (
    <div>
      <NodeHoverMenu
        show={show}
        sx={{
          position: 'relative'
        }}
        items={[
          ...(linkParent
            ? [
                {
                  label: 'Unlink outcome',
                  icon: <CancelOutlinedIcon />,
                  onClick: onActionClick(HoverMenuActions.UNLINK)
                }
              ]
            : []),
          {
            label: 'Comments',
            icon: <CommentOutlinedIcon />,
            onClick: onActionClick(HoverMenuActions.COMMENTS)
          }
        ]}
      />
    </div>
  )
}

export default OutcomeHeader
