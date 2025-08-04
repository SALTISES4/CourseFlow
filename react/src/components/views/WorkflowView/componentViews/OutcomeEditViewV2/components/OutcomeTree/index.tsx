import { Outcome as OutcomeType } from '@cf/redux/slices/outcomes.slice'
import { addOutcome } from '@cf/redux/slices/outcomes.slice'
import { _t } from '@cf/utility/Utility.class'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import GroupDropzone from './GroupDropzone'
import Outcome from './Outcome'
import * as Styled from './styles'

const OutcomeGroupWrap = ({
  id,
  title,
  children,
  level = 0
}: OutcomeType & {
  level?: number
}) => {
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
        <OutcomeGroup level={level + 1} outcomes={children} />
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

export default OutcomeGroupWrap
