import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'

import { Routes } from '@cf/router'
import Section from '@cfPages/Home/components/Section'

const SectionLayouts = () => (
  <Section header={{ title: 'Layouts' }}>
    <Stack direction="row" gap={1}>
      <Button href={Routes.PROJECT}>Project Details</Button>
    </Stack>
  </Section>
)

export default SectionLayouts
