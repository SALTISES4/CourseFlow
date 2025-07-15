import { Outcome as OutcomeType } from '@cf/redux/slices/outcomes.slice'
import { addOutcome } from '@cf/redux/slices/outcomes.slice'
import { _t } from '@cf/utility/Utility.class'
import { SxProps } from '@mui/material'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import GroupDropzone from './GroupDropzone'
import Outcome from './Outcome'
import * as Styled from './styles'

export const AddButton = ({
  sx,
  onClick
}: {
  onClick: () => void
  sx?: SxProps
}) => (
  <Styled.AddNewButton sx={sx} variant="text" disableRipple onClick={onClick}>
    {_t('Add outcome')}
  </Styled.AddNewButton>
)

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
    dispatch(
      addOutcome({
        id,
        title: 'Blank Outcome title'
      })
    )
  }, [dispatch, id])

  return (
    <GroupDropzone id={id} level={level + 1} hasChildren={!!children.length}>
      <Styled.OutcomeGroupWrap>
        <Styled.OutcomeGroupTitle variant="body2">
          {title}
        </Styled.OutcomeGroupTitle>
        <OutcomeGroup level={level + 1} outcomes={children} />
        <AddButton onClick={onAddNewOutcome} />
      </Styled.OutcomeGroupWrap>
    </GroupDropzone>
  )
}

export const OutcomeGroup = ({
  outcomes,
  level
}: {
  outcomes: OutcomeType[]
  level: number
}) => {
  if (!outcomes.length) {
    return null
  }

  return (
    <Styled.OutcomeGroup>
      {outcomes.map((outcome) => (
        <li key={outcome.id}>
          <Outcome level={level} {...outcome} />
        </li>
      ))}
    </Styled.OutcomeGroup>
  )
}

export default OutcomeGroupWrap
