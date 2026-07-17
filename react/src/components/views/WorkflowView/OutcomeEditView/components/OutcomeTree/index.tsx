import type {
  GraphUuid,
  OutcomeEntity
} from '@cf/features/graph/state/model/types'
import { selectOutcomeChildrenById } from '@cf/features/graph/state/selectors/outcomes.selectors'
import { RootState } from '@cf/redux/store'
import { useSelector } from 'react-redux'

import GroupDropzone from './GroupDropzone'
import Outcome from './Outcome'
import * as Styled from './styles'

export const OutcomeGroup = ({
  graphUuid,
  parentUuid
}: {
  graphUuid: GraphUuid
  parentUuid: string | null
}) => {
  const childOutcomes = useSelector((state: RootState) =>
    selectOutcomeChildrenById(state, graphUuid, parentUuid)
  )

  return (
    <Styled.OutcomeGroup>
      {childOutcomes.map((outcome) => (
        <Styled.OutcomeGroupItem
          key={outcome.uuid}
          padded={outcome.parentUuid === null}
        >
          <Outcome {...outcome} graphUuid={graphUuid} greenHover />
        </Styled.OutcomeGroupItem>
      ))}
    </Styled.OutcomeGroup>
  )
}

const OutcomeTree = ({
  graphUuid,
  outcomes
}: {
  graphUuid: GraphUuid
  outcomes: OutcomeEntity[]
}) => (
  <GroupDropzone
    graphUuid={graphUuid}
    uuid={null}
    level={0}
    hasChildren={!!outcomes.length}
  >
    <Styled.OutcomeGroupWrap>
      <OutcomeGroup graphUuid={graphUuid} parentUuid={null} />
    </Styled.OutcomeGroupWrap>
  </GroupDropzone>
)

export default OutcomeTree
