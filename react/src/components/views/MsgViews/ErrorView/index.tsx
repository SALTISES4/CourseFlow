import { OuterContentWrap } from '@cf/mui/helper'
import * as SCCommon from '@cf/mui/helper'
import { Box } from '@mui/material'

const ErrorView = ({ message }: { message: string }) => {
  return (
    <SCCommon.OuterContentWrap>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <OuterContentWrap sx={{ pb: 0 }}>
          <>There was an error loading this content</>
        </OuterContentWrap>
      </Box>
    </SCCommon.OuterContentWrap>
  )
}

export default ErrorView
