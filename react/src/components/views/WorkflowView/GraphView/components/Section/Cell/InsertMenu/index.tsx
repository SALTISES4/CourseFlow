import type { NodeInsertMode } from '@cf/features/graph/state/resolveNodeDropRow'
import TableRowsOutlinedIcon from '@mui/icons-material/TableRowsOutlined'
import ViewSectionOutlinedIcon from '@mui/icons-material/ViewWeekOutlined'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useTranslation } from 'react-i18next'

const InsertMenu = ({
  anchorEl,
  onOption,
  onClose
}: {
  anchorEl: HTMLElement | null
  onOption: (val: Exclude<NodeInsertMode, 'manual'>) => void
  onClose: () => void
}) => {
  const { t } = useTranslation('workflow')

  return <Menu
    id="node-insert-menu"
    data-test-id="workflow-manual-placement-dialog"
    aria-labelledby="insert-menu-button"
    anchorEl={anchorEl}
    open={Boolean(anchorEl)}
    disableAutoFocusItem
    onClose={onClose}
    anchorOrigin={{
      vertical: 'top',
      horizontal: 'center'
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'center'
    }}
  >
    <MenuItem
      dense
      data-test-id="workflow-manual-placement-row-button"
      onClick={() => onOption('row')}
    >
      <ListItemIcon>
        <TableRowsOutlinedIcon color="primary" />
      </ListItemIcon>
      <ListItemText>{t('graph.insertRow')}</ListItemText>
    </MenuItem>
    <MenuItem
      dense
      data-test-id="workflow-manual-placement-column-button"
      onClick={() => onOption('column')}
    >
      <ListItemIcon>
        <ViewSectionOutlinedIcon color="primary" />
      </ListItemIcon>
      <ListItemText>{t('graph.keepSameColumn')}</ListItemText>
    </MenuItem>
  </Menu>
}

export default InsertMenu
