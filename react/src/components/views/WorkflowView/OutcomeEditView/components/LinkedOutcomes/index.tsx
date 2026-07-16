import { selectOutcomeChildrenById } from '@cf/features/graph/state/selectors/outcomes.selectors'
import { RootState } from '@cfRedux/store'
import Outcome from '@cfSidebar/components/OutcomesTab/Outcome'
import { LinkedOutcomesPropsType } from '@cfViews/WorkflowView/OutcomeEditView/components/LinkedOutcomes/types'
import * as StyledOutcome from '@cfViews/WorkflowView/OutcomeEditView/components/OutcomeTree/styles'
import { MouseEvent, useCallback, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

// import Outcome from './Outcome' // circ dep
import * as Styled from './styles'

const LinkedOutcomes = ({
  graphUuid,
  parent,
  outcomes,
  highlight
}: LinkedOutcomesPropsType & { graphUuid: string }) => {
  const [show, setShow] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLSpanElement>(null)

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
              <Outcome graphUuid={graphUuid} uuid={outcome} />
            </StyledOutcome.OutcomeGroupItem>
          ))}
        </StyledOutcome.OutcomeGroup>
      </Styled.Popover>
    </Styled.Wrap>
  )
}

export const OutcomeGroup = ({
  graphUuid,
  parentUuid
}: {
  graphUuid: string
  parentUuid: string
}) => {
  const childOutcomes = useSelector((state: RootState) =>
    selectOutcomeChildrenById(state, graphUuid, parentUuid)
  )

  if (!childOutcomes.length) {
    return null
  }

  return (
    <StyledOutcome.OutcomeGroup>
      {childOutcomes.map((outcome) => (
        <StyledOutcome.OutcomeGroupItem key={outcome.uuid}>
          {/* horizontal outcome links deferred */}
        </StyledOutcome.OutcomeGroupItem>
      ))}
    </StyledOutcome.OutcomeGroup>
  )
}

export default LinkedOutcomes
