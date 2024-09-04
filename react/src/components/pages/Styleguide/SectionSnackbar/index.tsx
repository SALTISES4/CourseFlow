import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'

import Section from '@cfPages/Home/components/Section'
import { useSnackbar } from 'notistack'

const SectionSnackbar = () => {
  const { enqueueSnackbar } = useSnackbar()
  return (
    <Section header={{ title: 'Snackbars' }}>
      <Stack direction="row" gap={1}>
        <Button
          variant="contained"
          onClick={() =>
            enqueueSnackbar('Heeeello', {
              anchorOrigin: {
                horizontal: 'left',
                vertical: 'bottom'
              }
            })
          }
        >
          Say Hello (with custom position)
        </Button>
        <Button
          variant="contained"
          onClick={() =>
            enqueueSnackbar('Great success', {
              variant: 'success'
            })
          }
        >
          Great success (default position)
        </Button>
      </Stack>
    </Section>
  )
}

export default SectionSnackbar
