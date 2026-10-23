import { outcomeTableUiActions } from '@cf/features/graph/state/slices/outcomeTableUi.slice'
import { AppDispatch, RootState } from '@cf/redux/store'
import * as Styled from '@cfPages/Workflow/Sidebar/components/AddTab/styles'
import ToggleButton from '@mui/material/ToggleButton'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const OutcomeTableViewToolbar = () => {
  const dispatch = useDispatch<AppDispatch>()

  const viewType = useSelector(
    (state: RootState) => state.graph.outcomeTableUi.viewType
  )

  const onViewTypeChange = useCallback(
    (_, newVal: typeof viewType) => {
      dispatch(outcomeTableUiActions.viewTypeChange({ viewType: newVal }))
    },
    [dispatch]
  )

  return (
    <div style={{ width: '250px', marginBottom: '3em' }}>
      <Styled.InsertButtonGroup
        exclusive
        value={viewType}
        onChange={onViewTypeChange}
      >
        <ToggleButton color="primary" size="small" value="normal">
          Normal
        </ToggleButton>
        <ToggleButton color="primary" size="small" value="matrix">
          Competency matrix
        </ToggleButton>
      </Styled.InsertButtonGroup>
    </div>
  )
}

export default OutcomeTableViewToolbar
