import { _t } from '@cf/utility/Utility.class'
import * as Styled from '@cfViews/WorkflowView/OutcomeEditView/components/OutcomeTree/styles'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import { MouseEvent, MutableRefObject } from 'react'

type PropsType = {
  uuid: string
  level: number
  title: string
  dragRef: MutableRefObject<HTMLDivElement>
  highlighted: boolean
  collapsed: boolean
  setCollapsed: (value: boolean) => void
  showToggle: boolean
  onClick: () => void
  onToggleClick: (e: MouseEvent<HTMLButtonElement>) => void
}

const OutcomeHeader = ({
  level,
  title,
  dragRef,
  highlighted,
  collapsed,
  onClick,
  showToggle,
  onToggleClick
}: PropsType) => (
  <Styled.OutcomeHeader
    ref={dragRef}
    highlighted={highlighted}
    level={level}
    onClick={onClick}
  >
    <Styled.OutcomeHeaderInner>
      <Styled.OutcomeTitle variant="body2">{title}</Styled.OutcomeTitle>
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

export default OutcomeHeader
