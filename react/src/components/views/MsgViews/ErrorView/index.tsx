import { OuterContentWrap } from '@cf/mui/helper'
import * as SCCommon from '@cf/mui/helper'
import { Box } from '@mui/material'

const ErrorView = ({ message }: { message?: string }) => {
  const defaultMsg = 'There was an error loading this content'
  const msg = message ?? defaultMsg
  return (
    <SCCommon.OuterContentWrap>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <OuterContentWrap sx={{ pb: 0 }}>{msg}</OuterContentWrap>
      </Box>
    </SCCommon.OuterContentWrap>
  )
}

export default ErrorView
