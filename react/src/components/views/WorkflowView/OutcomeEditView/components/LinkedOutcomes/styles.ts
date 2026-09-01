import { LinkedOutcomesPropsType } from '@cfViews/WorkflowView/OutcomeEditView/components/LinkedOutcomes/types'
import MuiBadge from '@mui/material/Badge'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import MuiPopover from '@mui/material/Popover'
import { styled } from '@mui/material/styles'

type LinkedTo = LinkedOutcomesPropsType['parent']['type']

export const Wrap = styled(Box, {
  shouldForwardProp: (prop) => !['type'].includes(prop as string)
})<{ type: LinkedTo }>(({ theme, type }) => ({
  position: 'absolute',
  top: '18px',
  right: 0,
  width: '20px',
  height: '20px',
  transform: 'translateY(-50%)'
}))

export const Popover = styled(MuiPopover)(({ theme }) => ({
  '& .MuiPaper-root': {
    marginLeft: '8px',
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    boxShadow: `0 0 0 1px ${theme.palette.workflow.selected}`
  }
}))

export const Badge = styled(MuiBadge, {
  shouldForwardProp: (prop) => !['highlight', 'type'].includes(prop as string)
})<{ highlight?: boolean; type: LinkedTo }>(({ theme, highlight, type }) => ({
  top: '-5px',
  left: '10px',
  width: '20px',
  height: '20px',
  cursor: 'pointer',
  '& .MuiBadge-badge': {
    backgroundColor: highlight
      ? theme.palette.workflow.highlighted
      : type === 'node'
        ? theme.palette.common.white
        : theme.palette.workspaceBlocks.background
  }
}))

export const UnlinkButton = styled(IconButton)(({ theme }) => ({
  marginLeft: 'auto',
  borderRadius: 0,
  borderLeft: `1px solid ${theme.palette.divider}`,
  color: theme.palette.secondary.main
}))
