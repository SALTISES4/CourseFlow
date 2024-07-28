import { OuterContentWrap } from '@cfMUI/helper'

import SectionDialogs from './SectionDialogs'
import { Typography } from '@mui/material'

const Styleguide = () => {
  return (
    <OuterContentWrap>
      <Typography variant="h3" sx={{ mb: 4 }}>
        Courseflow Styleguide
      </Typography>
      <SectionDialogs />
    </OuterContentWrap>
  )
}

export default Styleguide
