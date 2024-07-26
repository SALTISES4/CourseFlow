import Typography from '@mui/material/Typography'
import Section from '@cfComponents/pages/Library/Home/components/Section'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'

import createProjectData from '../dumb/dialog/CreateProject/data'
import editProjectData from '../dumb/dialog/EditProject/data'

import { DIALOG_TYPE, useDialog } from '@cfComponents/common/dialog'
import ProjectDialog from '../dumb/dialog/Project'

import ImportNodes from '@cfCommonComponents/dialog/ImportNodes'
import ImportOutcomes from '@cfCommonComponents/dialog/ImportOutcomes'

const SectionDialogs = () => {
  // used to trigger the corresponding dialog
  const { dispatch } = useDialog()

  return (
    <>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Dialogs
      </Typography>
      <Section header={{ title: 'Project' }}>
        <Stack direction="row" gap={1}>
          <Button
            variant="contained"
            onClick={() => dispatch(DIALOG_TYPE.PROJECT_CREATE)}
          >
            Create Project
          </Button>
          <Button
            variant="contained"
            onClick={() => dispatch(DIALOG_TYPE.PROJECT_EDIT)}
          >
            Edit Project
          </Button>
        </Stack>

        <ProjectDialog
          {...createProjectData}
          type={DIALOG_TYPE.PROJECT_CREATE}
        />

        <ProjectDialog {...editProjectData} type={DIALOG_TYPE.PROJECT_EDIT} />
      </Section>

      <Section header={{ title: 'Import' }}>
        <Stack direction="row" gap={1}>
          <Button
            variant="contained"
            onClick={() => dispatch(DIALOG_TYPE.IMPORT_OUTCOMES)}
          >
            Import Outcomes
          </Button>
          <Button
            variant="contained"
            onClick={() => dispatch(DIALOG_TYPE.IMPORT_NODES)}
          >
            Import Nodes
          </Button>
        </Stack>

        <ImportOutcomes workflowID={1} />
        <ImportNodes workflowID={1} />
      </Section>
    </>
  )
}

export default SectionDialogs
