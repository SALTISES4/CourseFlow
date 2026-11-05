import { outcomeTableUiActions } from '@cf/features/graph/state/slices/outcomeTableUi.slice'
import type { AppDispatch, RootState } from '@cf/redux/store'
import { MenuItemType, SimpleMenu } from '@cfComponents/menu/Menu'
import SortIcon from '@mui/icons-material/Sort'
import ToggleButton from '@mui/material/ToggleButton'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import * as Styled from './styles'

const ViewToggle = () => {
  const { t } = useTranslation('workflow')
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
          {t('outcomeTable.toolbar.view.normal')}
        </ToggleButton>
        <ToggleButton color="primary" size="small" value="matrix">
          {t('outcomeTable.toolbar.view.matrix')}
        </ToggleButton>
      </Styled.ViewTypeButtonGroup>
    </Styled.ViewTypeWrapper>
  )
}

const sortLabels: Record<
  NonNullable<RootState['graph']['outcomeTableUi']['sortType']>,
  string
> = {
  time: 'outcomeTable.toolbar.sortBy.chronological',
  category: 'outcomeTable.toolbar.sortBy.category',
  context: 'outcomeTable.toolbar.sortBy.context'
}

const SortToggle = () => {
  const { t } = useTranslation('workflow')
  const dispatch = useDispatch<AppDispatch>()
  const { sortType, viewType } = useSelector(
    (state: RootState) => state.graph.outcomeTableUi
  )

  const sortLabel = t('outcomeTable.toolbar.sortBy.sort')

  const header: MenuItemType = {
    content: sortType
      ? `${sortLabel}: ${t(sortLabels[sortType] as any)}`
      : sortLabel,
    icon: <SortIcon />,
    showIconInList: true,
    show: true,
    disabled: viewType === 'matrix'
  }

  const menuItems: MenuItemType[] = [
    {
      content: t('outcomeTable.toolbar.sortBy.chronological'),
      action: () =>
        dispatch(
          outcomeTableUiActions.sortTypeChange({
            sort: 'time'
          })
        ),
      show: true
    },
    {
      content: t('outcomeTable.toolbar.sortBy.byCategory'),
      action: () =>
        dispatch(
          outcomeTableUiActions.sortTypeChange({
            sort: 'category'
          })
        ),
      show: true
    },
    {
      content: t('outcomeTable.toolbar.sortBy.byContext'),
      action: () =>
        dispatch(
          outcomeTableUiActions.sortTypeChange({
            sort: 'context'
          })
        ),
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
