import { WorkflowType } from '@cf/api/gen/types.gen'
import {
  type OutcomeTableSortMode,
  type OutcomeTableViewType,
  outcomeTableUiActions
} from '@cf/features/graph/state/slices/outcomeTableUi.slice'
import type { AppDispatch, RootState } from '@cf/redux/store'
import { MenuItemType, SimpleMenu } from '@cfComponents/menu/Menu'
import SortIcon from '@mui/icons-material/Sort'
import TableChartIcon from '@mui/icons-material/TableChart'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import * as Styled from './styles'

const ViewMenu = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { t } = useTranslation('workflow')
  const viewType = useSelector(
    (state: RootState) => state.graph.outcomeTableUi.viewType
  )
  const labels: Record<OutcomeTableViewType, string> = {
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
    Object.keys(labels) as OutcomeTableViewType[]
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
      closeOnItemAction
    />
  )
}

const SortMenu = ({ workflowType }: { workflowType: WorkflowType }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { t } = useTranslation('workflow')
  const sortMode = useSelector(
    (state: RootState) => state.graph.outcomeTableUi.sortMode
  )
  const header: MenuItemType = {
    content: t('outcomeTable.sort.title'),
    icon: <SortIcon />,
    showIconInList: true,
    show: true
  }
  const modes: { mode: OutcomeTableSortMode; label: string; show: boolean }[] =
    [
      {
        mode: 'chronological',
        label: t('outcomeTable.sort.chronological'),
        show: true
      },
      {
        mode: 'nodeCategory',
        label: t('outcomeTable.sort.byNodeCategory'),
        show: true
      },
      {
        mode: 'context',
        label: t('outcomeTable.sort.byContext'),
        show: workflowType === WorkflowType.COURSE
      }
    ]
  const menuItems: MenuItemType[] = modes.map(({ mode, label, show }) => ({
    uuid: `outcome-table-sort-${mode}`,
    content: label,
    action: () =>
      dispatch(outcomeTableUiActions.sortModeChange({ sortMode: mode })),
    disabled: mode === sortMode,
    show
  }))

  return (
    <SimpleMenu
      id="outcome-table-sort"
      header={header}
      menuItems={menuItems}
      closeOnItemAction
    />
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
