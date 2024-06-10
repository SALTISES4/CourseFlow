import Section from '@cfComponents/pages/Library/Home/components/Section'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'

// Create Project dialog
import CreateProjectDialog from '../dumb/dialog/CreateProject'
import createProjectData from '../dumb/dialog/CreateProject/data'

// Edit Project dialog
import EditProjectDialog from '../dumb/dialog/EditProject'
import editProjectData from '../dumb/dialog/EditProject/data'

import { DIALOG_TYPE, useDialog } from '@cfComponents/common/dialog'

const SectionDialogs = () => {
  // used to trigger the corresponding dialog
  const { dispatch } = useDialog()

  return (
    <Section header={{ title: 'Dialogs' }}>
      <Stack direction="row" gap={1}>
        <Button
          variant="contained"
          onClick={() => dispatch(DIALOG_TYPE.STYLEGUIDE_CREATE_PROJECT)}
        >
          Create Project
        </Button>
        <Button
          variant="contained"
          onClick={() => dispatch(DIALOG_TYPE.STYLEGUIDE_EDIT_PROJECT)}
        >
          Edit Project
        </Button>
      </Stack>

      <CreateProjectDialog {...createProjectData} />
      <EditProjectDialog {...editProjectData} />
    </Section>
  )
}

export default SectionDialogs
