import { RootState } from '@cf/redux/store'
import { _t } from '@cf/utility/Utility.class'
import { selectOutcomeChildrenById } from '@cfRedux/selectors/outcomes.selector'
import { Outcome as OutcomeType } from '@cfRedux/slices/outcomes.slice'
import { addOutcome } from '@cfRedux/slices/outcomes.slice'
import LinkedOutcomes from '@cfViews/WorkflowView/OutcomeEditView/components/LinkedOutcomes'
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
        <OutcomeGroup prefix={[]} parentId={id} />
        {!children.length && (
          <div style={{ marginRight: '28px' }}>
            <Styled.AddNewButton
              variant="text"
              disableRipple
              onClick={onAddNewOutcome}
            >
              {_t('Add outcome')}
            </Styled.AddNewButton>
          </div>
        )}
      </Styled.OutcomeGroupWrap>
    </GroupDropzone>
  )
}

export const OutcomeGroup = ({
  parentId,
  prefix
}: {
  parentId: number
  prefix: (number | string)[]
}) => {
  const childOutcomes = useSelector((state: RootState) =>
    selectOutcomeChildrenById(state, parentId)
  )

  if (!childOutcomes.length) {
    return null
  }

  return (
    <Styled.OutcomeGroup>
      {childOutcomes.map((outcome, index) => (
        <Styled.OutcomeGroupItem key={outcome.id} padded={outcome.level === 1}>
          <Outcome {...outcome} prefix={[...prefix, index + 1]} />
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

export default OutcomeGroupWrap
