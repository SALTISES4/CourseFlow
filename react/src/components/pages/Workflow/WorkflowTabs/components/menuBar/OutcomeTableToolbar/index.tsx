import { WorkflowType } from '@cf/api/gen/types.gen'
import {
  type OutcomeTableUiState,
  outcomeTableUiActions
} from '@cf/features/graph/state/slices/outcomeTableUi.slice'
import type { AppDispatch, RootState } from '@cf/redux/store'
import { MenuItemType, SimpleMenu } from '@cfComponents/menu/Menu'
import SortIcon from '@mui/icons-material/Sort'
import TableChartIcon from '@mui/icons-material/TableChart'
import type { ParseKeys } from 'i18next'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import * as Styled from './styles'

const ViewMenu = () => {
  const { t } = useTranslation('workflow')
  const dispatch = useDispatch<AppDispatch>()
  const viewType = useSelector(
    (state: RootState) => state.graph.outcomeTableUi.viewType
  )
  const labels: Record<OutcomeTableUiState['viewType'], string> = {
    normal: t('outcomeTable.view.normal'),
    matrix: t('outcomeTable.view.competencyMatrix')
  }
  const header: MenuItemType = {
    content: labels[viewType],
    icon: <TableChartIcon />,
    showIconInList: true,
    show: true
  }
  const menuItems: MenuItemType[] = (
    Object.keys(labels) as OutcomeTableUiState['viewType'][]
  ).map((nextViewType) => ({
    uuid: `outcome-table-style-${nextViewType}`,
    content: labels[nextViewType],
    action: () =>
      dispatch(
        outcomeTableUiActions.viewTypeChange({ viewType: nextViewType })
      ),
    disabled: nextViewType === viewType,
    show: true
  }))

  return (
    <SimpleMenu
      id="outcome-table-style"
      header={header}
      menuItems={menuItems}
    />
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
    <ViewMenu />
    <SortMenu workflowType={workflowType} />
  </Styled.ToolbarWrapper>
)

export default OutcomeTableToolbar
