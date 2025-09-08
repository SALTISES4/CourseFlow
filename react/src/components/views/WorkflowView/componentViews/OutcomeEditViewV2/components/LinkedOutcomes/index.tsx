import { selectOutcomeChildrenById } from '@cf/redux/selectors/outcomes.selector'
import { AppState } from '@cf/redux/types/type'
import * as StyledOutcome from '@cfViews/WorkflowView/componentViews/OutcomeEditViewV2/components/OutcomeTree/styles'
import { MouseEvent, useCallback, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import Outcome from './Outcome'
import * as Styled from './styles'

export type PropsType = {
  parent: {
    id: number
    type: 'node' | 'outcome'
  }
  outcomes: number[]
}

const LinkedOutcomes = ({ parent, outcomes }: PropsType) => {
  const [show, setShow] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLSpanElement>(null)
  const outcomesData = useSelector(
    (state: AppState) => state.outcomes.outcomeData
  )

  const showPopover = useCallback((val: boolean) => {
    return (e: MouseEvent<HTMLSpanElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setShow(val)
    }
  }, [])

  return (
    <Styled.Wrap ref={wrapRef} type={parent.type}>
      <Styled.Badge
        ref={badgeRef}
        onClick={showPopover(true)}
        badgeContent={outcomes.length}
      />
      <Styled.Popover
        open={show}
        anchorEl={wrapRef?.current}
        onClose={showPopover(false)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <StyledOutcome.OutcomeGroup sx={{ mt: 0 }}>
          {outcomes.map((outcome) => (
            <StyledOutcome.OutcomeGroupItem key={outcome}>
              <Outcome {...outcomesData[outcome]} linkParent={parent} />
            </StyledOutcome.OutcomeGroupItem>
          ))}
        </StyledOutcome.OutcomeGroup>
      </Styled.Popover>
    </Styled.Wrap>
  )
}

export const OutcomeGroup = ({ parentId }: { parentId: number }) => {
  const childOutcomes = useSelector((state: AppState) =>
    selectOutcomeChildrenById(state, parentId)
  )

  if (!childOutcomes.length) {
    return null
  }

  return (
    <StyledOutcome.OutcomeGroup>
      {childOutcomes.map((outcome) => (
        <StyledOutcome.OutcomeGroupItem key={outcome.id}>
          <Outcome {...outcome} />
        </StyledOutcome.OutcomeGroupItem>
      ))}
    </StyledOutcome.OutcomeGroup>
  )
}

export default LinkedOutcomes
