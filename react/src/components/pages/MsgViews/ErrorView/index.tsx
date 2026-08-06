import { OuterContentWrap } from '@cfMUI/helper'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const ErrorView = ({ message }: { message?: string }) => (
  <OuterContentWrap>
    <Box sx={{ pb: 1, borderBottom: 1, borderColor: 'divider' }}>
      <OuterContentWrap sx={{ pb: 0 }}>
        <Typography component="h3" variant="h4">
          {message ?? 'There was an error loading this content'}
        </Typography>
      </OuterContentWrap>
    </Box>
  </OuterContentWrap>
)

export default ErrorView
