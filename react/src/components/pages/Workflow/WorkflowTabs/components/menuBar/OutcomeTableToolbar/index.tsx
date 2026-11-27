import { WorkflowType } from '@cf/api/gen/types.gen'
import {
  type OutcomeTableUiState,
  outcomeTableUiActions
} from '@cf/features/graph/state/slices/outcomeTableUi.slice'
import type { AppDispatch, RootState } from '@cf/redux/store'
import { MenuItemType, SimpleMenu } from '@cfComponents/menu/Menu'
import SortIcon from '@mui/icons-material/Sort'
import ToggleButton from '@mui/material/ToggleButton'
import type { ParseKeys } from 'i18next'
import { type MouseEvent, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import * as Styled from './styles'

const ViewToggle = () => {
  const { t } = useTranslation('workflow')
  const dispatch = useDispatch<AppDispatch>()
  const viewType = useSelector(
    (state: RootState) => state.graph.outcomeTableUi.viewType
  )
  const labels: Record<OutcomeTableUiState['viewType'], string> = {
    normal: t('outcomeTable.view.normal'),
    matrix: t('outcomeTable.view.competencyMatrix')
  }

  const onViewTypeChange = useCallback(
    (
      _event: MouseEvent<HTMLElement>,
      nextViewType: OutcomeTableUiState['viewType'] | null
    ) => {
      if (nextViewType === null) {
        return
      }

      dispatch(outcomeTableUiActions.viewTypeChange({ viewType: nextViewType }))
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
          {labels.normal}
        </ToggleButton>
        <ToggleButton color="primary" size="small" value="matrix">
          {labels.matrix}
        </ToggleButton>
      </Styled.ViewTypeButtonGroup>
    </Styled.ViewTypeWrapper>
  )
}

type SortType = NonNullable<RootState['graph']['outcomeTableUi']['sortType']>

const sortLabels = {
  time: 'outcomeTable.sort.chronological',
  category: 'outcomeTable.sort.byNodeCategory',
  context: 'outcomeTable.sort.byContext'
} satisfies Record<SortType, ParseKeys<'workflow'>>

const SortMenu = ({ workflowType }: { workflowType: WorkflowType }) => {
  const { t } = useTranslation('workflow')
  const dispatch = useDispatch<AppDispatch>()
  const sortType = useSelector(
    (state: RootState) => state.graph.outcomeTableUi
  ).sortType
  const selectedSort: SortType = sortType ?? 'time'

  const sortLabel = t('outcomeTable.sort.title')

  const header: MenuItemType = {
    content: sortLabel,
    icon: <SortIcon />,
    showIconInList: true,
    show: true
  }

  const modes: Array<{
    type: SortType
    show: boolean
  }> = [
    {
      type: 'time',
      show: true
    },
    {
      type: 'category',
      show: true
    },
    {
      type: 'context',
      show: workflowType === WorkflowType.COURSE
    }
  ]
  const menuItems: MenuItemType[] = modes.map(({ type, show }) => ({
    uuid: `outcome-table-sort-${type}`,
    content: t(sortLabels[type]),
    action: () =>
      dispatch(outcomeTableUiActions.sortTypeChange({ sort: type })),
    disabled: type === selectedSort,
    show
  }))

  return (
    <SimpleMenu id="outcome-table-sort" header={header} menuItems={menuItems} />
  )
}

const OutcomeTableToolbar = ({
  workflowType
}: {
  workflowType: WorkflowType
}) => (
  <Styled.ToolbarWrapper>
    <ViewToggle />
    <SortMenu workflowType={workflowType} />
  </Styled.ToolbarWrapper>
)

export default OutcomeTableToolbar
