import * as Styled from '@cfViews/WorkflowView/OutcomeEditView/components/OutcomeTree/styles'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import Tooltip from '@mui/material/Tooltip'
import { MouseEvent, ReactNode, RefObject } from 'react'

type PropsType = {
  uuid: string
  level: number
  title: string
  dragRef?: RefObject<HTMLDivElement>
  highlighted?: boolean
  collapsed: boolean
  showToggle: boolean
  action?: ReactNode
  titleTooltip?: boolean
  setCollapsed: (value: boolean) => void
  onClick?: () => void
  onToggleClick: (e: MouseEvent<HTMLButtonElement>) => void
  onContentMouseEnter?: () => void
}

const OutcomeHeader = ({
  level,
  title,
  dragRef,
  highlighted,
  collapsed,
  showToggle,
  action,
  titleTooltip,
  onClick,
  onToggleClick,
  onContentMouseEnter
}: PropsType) => (
  <Styled.OutcomeHeader
    ref={dragRef}
    highlighted={highlighted}
    level={level}
    onClick={onClick}
  >
    <Styled.OutcomeHeaderInner onMouseEnter={onContentMouseEnter}>
      {titleTooltip ? (
        <Tooltip
          variant="green"
          placement="top"
          arrow
          disableInteractive
          title={title}
        >
          <Styled.OutcomeTitle variant="body2">{title}</Styled.OutcomeTitle>
        </Tooltip>
      ) : (
        <Styled.OutcomeTitle variant="body2">{title}</Styled.OutcomeTitle>
      )}
    </Styled.OutcomeHeaderInner>
    {action}
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

export default OutcomeHeader
