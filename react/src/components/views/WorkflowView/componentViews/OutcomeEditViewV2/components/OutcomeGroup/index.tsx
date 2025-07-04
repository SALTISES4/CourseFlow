import { Outcome as OutcomeType } from '@cf/redux/slices/outcomes.slice'
import { addOutcome, findIndexPath } from '@cf/redux/slices/outcomes.slice'
import { AppState } from '@cf/redux/types/type'
import { _t } from '@cf/utility/Utility.class'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Styled from './styles'

type OutcomeGroupType = {
  outcomes: OutcomeType[]
}

const OutcomeGroup = ({
  outcomes,
  level = 1
}: OutcomeGroupType & { level?: number }) => (
  <Styled.OutcomeGroup data-level={level}>
    {outcomes.map((outcome) => (
      <li key={outcome.id}>
        <Outcome level={level} {...outcome} />
      </li>
    ))}
  </Styled.OutcomeGroup>
)

const Outcome = ({
  id,
  title,
  children,
  level
}: OutcomeType & { level: number }) => {
  const dispatch = useDispatch()
  const [collapsed, setCollapsed] = useState(true)
  const outcomes = useSelector((state: AppState) => state.outcomes)

  const onAddNewClick = useCallback(
    (parent: OutcomeType) => {
      return () => {
        const parentIndexPath = findIndexPath(parent, outcomes)

        // just to avoid id collision, remove when we start working with real IDs
        const multiplier = parentIndexPath.length * 100

        // figure out the new id
        const newId = parent.children?.length
          ? parent.children[parent.children.length - 1].id + 1
          : multiplier + 1

        dispatch(
          addOutcome({
            parent,
            id: newId,
            title: 'Blank Outcome title'
          })
        )
      }
    },
    [dispatch, outcomes]
  )

  const onToggleClick = useCallback(() => {
    setCollapsed(!collapsed)
  }, [collapsed])

  const showToggleButton = level !== 3

  return (
    <Box data-id={id}>
      <Styled.OutcomeHeader>
        <Styled.OutcomeTitle variant="body2">{title}</Styled.OutcomeTitle>
        {showToggleButton && (
          <Styled.OutcomeHeaderToggle onClick={onToggleClick}>
            {collapsed ? (
              <AddIcon fontSize="small" />
            ) : (
              <RemoveIcon fontSize="small" />
            )}
          </Styled.OutcomeHeaderToggle>
        )}
      </Styled.OutcomeHeader>

      {!collapsed && (
        <>
          {children && <OutcomeGroup level={level + 1} outcomes={children} />}
          {showToggleButton && (
            <Styled.AddNewButton
              variant="text"
              disableRipple
              onClick={onAddNewClick({ id, title, children })}
            >
              {_t('Add outcome')}
            </Styled.AddNewButton>
          )}
        </>
      )}
    </Box>
  )
}

export default OutcomeGroup
