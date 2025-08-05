import { Outcome as OutcomeType } from '@cf/redux/slices/outcomes.slice'
import { _t } from '@cf/utility/Utility.class'
import * as Styled from '@cfViews/WorkflowView/componentViews/OutcomeEditViewV2/components/OutcomeTree/styles'

import Outcome from '../Outcome'

export const OutcomeGroup = ({
  outcomes,
  level,
  prefix
}: {
  outcomes: OutcomeType[]
  level: number
  prefix?: number[]
}) => {
  if (!outcomes.length) {
    return null
  }

  const pref = []
  if (prefix) {
    pref.unshift(...prefix)
  }

  return (
    <Styled.OutcomeGroup>
      {outcomes.map((outcome, index) => (
        <li key={outcome.id}>
          <Outcome level={level} prefix={[...pref, index + 1]} {...outcome} />
        </li>
      ))}
    </Styled.OutcomeGroup>
  )
}

export default OutcomeGroup
