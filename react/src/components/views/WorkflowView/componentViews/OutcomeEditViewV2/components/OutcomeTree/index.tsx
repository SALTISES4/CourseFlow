import { selectOutcomeChildrenById } from '@cf/redux/selectors/outcomes.selector'
import { Outcome as OutcomeType } from '@cf/redux/slices/outcomes.slice'
import { addOutcome } from '@cf/redux/slices/outcomes.slice'
import { AppState } from '@cf/redux/types/type'
import { _t } from '@cf/utility/Utility.class'
import LinkedOutcomes from '@cfViews/WorkflowView/componentViews/OutcomeEditViewV2/components/LinkedOutcomes'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import GroupDropzone from './GroupDropzone'
import Outcome from './Outcome'
import * as Styled from './styles'

const OutcomeGroupWrap = ({ id, title, children, level }: OutcomeType) => {
  const dispatch = useDispatch()

  const onAddNewOutcome = useCallback(() => {
    dispatch(addOutcome({ id }))
  }, [dispatch, id])

  return (
    <GroupDropzone id={id} level={level + 1} hasChildren={!!children.length}>
      <Styled.OutcomeGroupWrap>
        <Styled.OutcomeGroupTitle variant="body2">
          {title}
        </Styled.OutcomeGroupTitle>
        <OutcomeGroup parentId={id} />
        {!children.length && (
          <Styled.AddNewButton
            variant="text"
            disableRipple
            onClick={onAddNewOutcome}
          >
            {_t('Add outcome')}
          </Styled.AddNewButton>
        )}
      </Styled.OutcomeGroupWrap>
    </GroupDropzone>
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
    <Styled.OutcomeGroup>
      {childOutcomes.map((outcome) => (
        <Styled.OutcomeGroupItem key={outcome.id} level={outcome.level}>
          <Outcome {...outcome} />
          {/* {outcome.level === 1 && <LinkedOutcomes outcomes={outcome.children} />} */}
        </Styled.OutcomeGroupItem>
      ))}
    </Styled.OutcomeGroup>
  )
}

export default OutcomeGroupWrap
