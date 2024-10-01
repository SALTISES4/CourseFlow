import Accordion from '@mui/material/Accordion'
import Chip from '@mui/material/Chip'
import { styled } from '@mui/material/styles'

export const StyledAccordion = styled(Accordion)(({ theme }) => ({
  '&.MuiPaper-root': {
    boxShadow: `0 0 0 1px ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    border: 0,
    '&::before': {
      content: 'none'
    }
  },
  '&.Mui-expanded': {
    marginTop: 0,
    '.MuiAccordionSummary-root': {
      minHeight: 'auto'
    },
    '.MuiAccordionSummary-content': {
      margin: '12px 0'
    }
  }
}))

export const AdvancedLabel = styled(Chip)(({ theme }) => ({
  height: '22px',
  border: 0,
  borderRadius: theme.shape.borderRadius,
  alignSelf: 'center',
  backgroundColor: 'rgb(229, 246, 253)',
  color: 'rgb(1, 67, 97)',
  fontWeight: 600
}))
