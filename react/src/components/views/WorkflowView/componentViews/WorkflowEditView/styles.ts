import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

const COLUMN_WIDTH = 180

export const CellRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(1),
  gap: theme.spacing(3)
}))

export const Cell = styled(Box)(() => ({
  position: 'relative',
  width: `${COLUMN_WIDTH}px`,
  flexShrink: 0
}))

export const DebugCellInfo = styled('span')(() => ({
  position: 'absolute',
  top: '0.5em',
  left: '0.5em',
  fontWeight: 600,
  fontSize: '12px',
  opacity: 0.5
}))
