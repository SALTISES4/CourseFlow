import { CFRoutes } from '@cf/router'
import Section from '@cfPages/Home/components/Section'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { Link } from 'react-router-dom'

const SectionLayouts = () => (
  <Section header={{ title: 'Layouts' }}>
    <Stack direction="row" gap={1}>
      <Button>
        <Link to={CFRoutes.STYLEGUIDE_PROJECT}>Project Details</Link>
      </Button>
    </Stack>
  </Section>
)

export default SectionLayouts
