import { OuterContentWrap } from '@cfMUI/helper'
import { Box } from '@mui/material'

const ErrorView = ({ message }: { message?: string }) => {
  const defaultMsg = 'There was an error loading this content'
  const msg = message ?? defaultMsg
  return (
    <OuterContentWrap>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <OuterContentWrap sx={{ pb: 0 }}>{msg}</OuterContentWrap>
      </Box>
    </OuterContentWrap>
  )
}

export default ErrorView
