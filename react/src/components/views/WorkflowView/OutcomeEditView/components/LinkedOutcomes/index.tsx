import { selectOutcomeChildrenById } from '@cfRedux/selectors/outcomes.selector'
import { RootState } from '@cfRedux/store'
import * as StyledOutcome from '@cfViews/WorkflowView/OutcomeEditView/components/OutcomeTree/styles'
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
  highlight?: boolean
}

const LinkedOutcomes = ({ parent, outcomes, highlight }: PropsType) => {
  const [show, setShow] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLSpanElement>(null)
  const entities = useSelector((state: RootState) => state.outcomes.entities)

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
        highlight={highlight}
        type={parent.type}
      />
      <Styled.Popover
        open={show}
        anchorEl={wrapRef?.current}
        onClose={showPopover(false)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
      >
        <StyledOutcome.OutcomeGroup sx={{ mt: 0 }}>
          {outcomes.map((outcome) => (
            <StyledOutcome.OutcomeGroupItem key={outcome}>
              <Outcome {...entities[outcome]} linkParent={parent} />
            </StyledOutcome.OutcomeGroupItem>
          ))}
        </StyledOutcome.OutcomeGroup>
      </Styled.Popover>
    </Styled.Wrap>
  )
}

export const OutcomeGroup = ({ parentId }: { parentId: number }) => {
  const childOutcomes = useSelector((state: RootState) =>
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
