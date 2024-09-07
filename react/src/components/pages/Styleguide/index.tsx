import { OuterContentWrap } from '@cf/mui/helper'
import { Typography } from '@mui/material'

import SectionDialogs from './SectionDialogs'
import SectionLayouts from './SectionLayouts'

import SectionSnackbar from './SectionSnackbar'

const Styleguide = () => {
  return (
    <OuterContentWrap>
      <Typography variant="h3" sx={{ mb: 4 }}>
        Courseflow Styleguide
      </Typography>

      <SectionLayouts />

      <SectionSnackbar />

      <SectionDialogs />
    </OuterContentWrap>
  )
}

export default Styleguide
