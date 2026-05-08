import { OuterContentWrap } from '@cfMUI/helper'
import { Box } from '@mui/material'

const ErrorView = ({ message }: { message?: string }) => (
  <OuterContentWrap>
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <OuterContentWrap sx={{ pb: 0 }}>
        {message ?? 'There was an error loading this content'}
      </OuterContentWrap>
    </Box>
  </OuterContentWrap>
)

export default ErrorView
