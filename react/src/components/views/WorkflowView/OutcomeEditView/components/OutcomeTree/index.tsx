import { RootState } from '@cf/redux/store'
import { _t } from '@cf/utility/Utility.class'
import { selectOutcomeChildrenById } from '@cfRedux/selectors/outcomes.selector'
import { Outcome as OutcomeType } from '@cfRedux/slices/outcomes.slice'
import LinkedOutcomes from '@cfViews/WorkflowView/OutcomeEditView/components/LinkedOutcomes'
import { useSelector } from 'react-redux'

import GroupDropzone from './GroupDropzone'
import Outcome from './Outcome'
import * as Styled from './styles'

const OutcomeTree = ({ outcomes }: { outcomes: OutcomeType[] }) => (
  <GroupDropzone id={-1} level={0} hasChildren={!!outcomes.length}>
    <Styled.OutcomeGroupWrap>
      <OutcomeGroup parentId={null} />
    </Styled.OutcomeGroupWrap>
  </GroupDropzone>
)

export const OutcomeGroup = ({ parentId }: { parentId: number | null }) => {
  const childOutcomes = useSelector((state: RootState) =>
    selectOutcomeChildrenById(state, parentId)
  )

  return (
    <Styled.OutcomeGroup>
      {childOutcomes.map((outcome) => (
        <Styled.OutcomeGroupItem key={outcome.id} padded={outcome.level === 0}>
          <Outcome {...outcome} />
          {!!outcome.linkedOutcomes?.length && (
            <LinkedOutcomes
              parent={{
                id: outcome.id,
                type: 'outcome'
              }}
              outcomes={outcome.linkedOutcomes}
            />
          )}
        </Styled.OutcomeGroupItem>
      ))}
    </Styled.OutcomeGroup>
  )
}

export default OutcomeTree
