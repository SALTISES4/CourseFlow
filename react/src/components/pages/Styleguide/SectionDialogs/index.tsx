import Section from '@cfComponents/pages/Library/Home/components/Section'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'

import createProjectData from '../dumb/dialog/CreateProject/data'
import editProjectData from '../dumb/dialog/EditProject/data'

import { DIALOG_TYPE, useDialog } from '@cfComponents/common/dialog'
import ProjectDialog from '../dumb/dialog/Project'

const SectionDialogs = () => {
  // used to trigger the corresponding dialog
  const { dispatch } = useDialog()

  return (
    <Section header={{ title: 'Dialogs' }}>
      <Stack direction="row" gap={1}>
        <Button
          variant="contained"
          onClick={() => dispatch(DIALOG_TYPE.STYLEGUIDE_PROJECT_CREATE)}
        >
          Create Project
        </Button>
        <Button
          variant="contained"
          onClick={() => dispatch(DIALOG_TYPE.STYLEGUIDE_PROJECT_EDIT)}
        >
          Edit Project
        </Button>
      </Stack>

      <ProjectDialog
        {...createProjectData}
        type={DIALOG_TYPE.STYLEGUIDE_PROJECT_CREATE}
      />

      <ProjectDialog
        {...editProjectData}
        type={DIALOG_TYPE.STYLEGUIDE_PROJECT_EDIT}
      />
    </Section>
  )
}

export default SectionDialogs
