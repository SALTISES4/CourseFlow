import theme from '@cf/mui/theme'
import BetterSelectionManager from '@cf/redux/BetterSelectionManager'
import { Outcome as OutcomeType } from '@cf/redux/slices/outcomes.slice'
import { addOutcome } from '@cf/redux/slices/outcomes.slice'
import { AppState } from '@cf/redux/types/type'
import { CfObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import { SxProps } from '@mui/material'
import Box from '@mui/material/Box'
import { MouseEvent, useCallback, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Styled from './styles'

const AddButton = ({ sx, onClick }: { onClick: () => void; sx?: SxProps }) => (
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
    <Styled.OutcomeGroupWrap>
      <Styled.OutcomeGroupTitle variant="body2">
        {title}
      </Styled.OutcomeGroupTitle>

      <OutcomeGroup level={level + 1} outcomes={children} />

      <AddButton onClick={onAddNewOutcome} />
    </Styled.OutcomeGroupWrap>
  )
}

const OutcomeGroup = ({
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

const Outcome = ({
  id,
  title,
  children,
  level
}: OutcomeType & { level: number }) => {
  const dispatch = useDispatch()
  const sidebarData = useSelector((state: AppState) => state.sidebar.edit)
  const manager = useRef(new BetterSelectionManager(dispatch))
  const [collapsed, setCollapsed] = useState(true)

  const selected =
    sidebarData.objectType === CfObjectType.OUTCOME && sidebarData.id === id

  const onAddNewClick = useCallback(() => {
    dispatch(
      addOutcome({
        id,
        title: 'Blank Outcome title'
      })
    )
  }, [dispatch, id])

  const onToggleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      setCollapsed(!collapsed)
    },
    [collapsed]
  )

  const onHeaderClick = useCallback(() => {
    if (selected) {
      manager.current.clearSidebar()
    } else {
      manager.current.updateSidebar(id, CfObjectType.OUTCOME, -1)
    }
  }, [id, selected])

  const showToggleButton = level !== 3

  return (
    <Box>
      <Styled.OutcomeHeader selected={selected} onClick={onHeaderClick}>
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
            <footer style={{ paddingLeft: theme.spacing(level) }}>
              <AddButton onClick={onAddNewClick} />
            </footer>
          )}
        </>
      )}
    </Box>
  )
}

export default OutcomeGroupWrap
