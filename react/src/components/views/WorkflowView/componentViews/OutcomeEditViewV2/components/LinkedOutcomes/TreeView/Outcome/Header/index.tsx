import useHover from '@cf/hooks/useHover'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import NodeHoverMenu from '@cfComponents/UIPrimitives/NodeHoverMenu'
import { sidebarEdit } from '@cfRedux/slices/sidebar.slice'
import * as Styled from '@cfViews/WorkflowView/componentViews/OutcomeEditViewV2/components/OutcomeTree/styles'
import AddIcon from '@mui/icons-material/Add'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import ChatIcon from '@mui/icons-material/Chat'
import RemoveIcon from '@mui/icons-material/Remove'
import { MouseEvent, MutableRefObject, useCallback } from 'react'
import { useDispatch } from 'react-redux'

type PropsType = {
  id: number
  level: number
  title: string
  dragRef: MutableRefObject<HTMLDivElement>
  selected: boolean
  collapsed: boolean
  showToggle: boolean
  onToggleClick: (e: MouseEvent<HTMLButtonElement>) => void
}

const OutcomeHeader = ({
  id,
  level,
  title,
  dragRef,
  selected,
  collapsed,
  showToggle,
  onToggleClick
}: PropsType) => {
  const [, isHovered] = useHover(dragRef)

  return (
    <Styled.OutcomeHeader
      ref={dragRef}
      highlighted={false}
      selected={selected}
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
        <HoverMenu show={isHovered} id={id} />
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

const HoverMenu = ({ id, show }: { id: PropsType['id']; show: boolean }) => {
  const dispatch = useDispatch()

  const onActionClick = useCallback(
    (action: HoverMenuActions) => {
      return (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        switch (action) {
          case HoverMenuActions.UNLINK:
            console.log('delete linked outcome', id)
            break
          case HoverMenuActions.COMMENTS:
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
    [dispatch, id]
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
            label: 'Unlink outcome',
            icon: <CancelOutlinedIcon />,
            onClick: onActionClick(HoverMenuActions.UNLINK)
          },
          {
            label: 'Comments',
            icon: <ChatIcon />,
            onClick: onActionClick(HoverMenuActions.COMMENTS)
          }
        ]}
      />
    </div>
  )
}

export default OutcomeHeader
