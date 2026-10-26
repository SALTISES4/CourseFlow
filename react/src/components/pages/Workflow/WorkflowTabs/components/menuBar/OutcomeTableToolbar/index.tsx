import { outcomeTableUiActions } from '@cf/features/graph/state/slices/outcomeTableUi.slice'
import type { AppDispatch, RootState } from '@cf/redux/store'
import { MenuItemType, SimpleMenu } from '@cfComponents/menu/Menu'
import SortIcon from '@mui/icons-material/Sort'
import ToggleButton from '@mui/material/ToggleButton'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Styled from './styles'

const ViewToggle = () => {
  const dispatch = useDispatch<AppDispatch>()

  const viewType = useSelector(
    (state: RootState) => state.graph.outcomeTableUi.viewType
  )

  const onViewTypeChange = useCallback(
    (_, newVal: typeof viewType) => {
      if (!newVal) {
        return
      }

      dispatch(outcomeTableUiActions.viewTypeChange({ viewType: newVal }))
    },
    [dispatch]
  )

  return (
    <Styled.ViewTypeWrapper>
      <Styled.ViewTypeButtonGroup
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
      </Styled.ViewTypeButtonGroup>
    </Styled.ViewTypeWrapper>
  )
}

// TODO: translate strings
const SortToggle = () => {
  const header: MenuItemType = {
    content: 'Sort',
    icon: <SortIcon />,
    showIconInList: true,
    show: true
  }

  const menuItems: MenuItemType[] = [
    {
      content: 'Chronological',
      show: true
    },
    {
      content: 'By node category',
      show: true
    },
    {
      content: 'By context',
      show: true
    }
  ]

  return (
    <SimpleMenu
      id="outcometable-sort-menu"
      data-test-id="OutcomeTableSortMenu"
      header={header}
      menuItems={menuItems}
    />
  )
}

const OutcomeTableToolbar = () => (
  <Styled.ToolbarWrapper>
    <ViewToggle />
    <SortToggle />
  </Styled.ToolbarWrapper>
)

export default OutcomeTableToolbar
