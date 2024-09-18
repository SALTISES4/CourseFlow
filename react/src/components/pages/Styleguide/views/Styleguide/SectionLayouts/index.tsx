import { CFRoutes } from '@cf/router/appRoutes'
import Section from '@cfPages/Styleguide/views/Homepage/components/Section'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'

const SectionLayouts = () => (
  <Section header={{ title: 'Layouts' }}>
    <Stack direction="row" gap={1}>
      <Button href={CFRoutes.PROJECT}>Project Details</Button>
    </Stack>
  </Section>
)

export default SectionLayouts
