import { Outcome as OutcomeType } from '@cf/redux/slices/outcomes.slice'
import { _t } from '@cf/utility/Utility.class'
import * as Styled from '@cfViews/WorkflowView/componentViews/OutcomeEditViewV2/components/OutcomeTree/styles'

import Outcome from '../Outcome'

export const OutcomeGroup = ({ outcomes }: { outcomes: OutcomeType[] }) => {
  if (!outcomes.length) {
    return null
  }

  return (
    <Styled.OutcomeGroup>
      {outcomes.map((outcome) => (
        <li key={outcome.id}>
          <Outcome {...outcome} />
        </li>
      ))}
    </Styled.OutcomeGroup>
  )
}

export default OutcomeGroup
