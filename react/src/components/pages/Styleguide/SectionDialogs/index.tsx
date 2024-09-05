import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import Section from '@cfPages/Home/components/Section'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

const SectionDialogs = () => {
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
          <Button
            variant="contained"
            onClick={() => dispatch(DIALOG_TYPE.PROJECT_EXPORT)}
          >
            Export Project
          </Button>
        </Stack>
      </Section>

      <Section header={{ title: 'Link workflow' }}>
        <Stack direction="row" gap={1}>
          <Button
            variant="contained"
            onClick={() => dispatch(DIALOG_TYPE.WORKFLOW_LINK)}
          >
            Link worfklow
          </Button>
        </Stack>
      </Section>

      <Section header={{ title: 'Archive' }}>
        <Stack direction="row" gap={1}>
          <Button
            variant="contained"
            onClick={() => dispatch(DIALOG_TYPE.PROJECT_ARCHIVE)}
          >
            Archive Project
          </Button>
          <Button
            variant="contained"
            onClick={() => dispatch(DIALOG_TYPE.COURSE_ARCHIVE)}
          >
            Archive Course
          </Button>
        </Stack>
      </Section>

      <Section header={{ title: 'Activity' }}>
        <Stack direction="row" gap={1}>
          <Button
            variant="contained"
            onClick={() => dispatch(DIALOG_TYPE.ACTIVITY_CREATE)}
          >
            Create Activity
          </Button>
          <Button
            variant="contained"
            onClick={() => dispatch(DIALOG_TYPE.ACTIVITY_EDIT)}
          >
            Edit Activity
          </Button>
        </Stack>
      </Section>

      <Section header={{ title: 'Program' }}>
        <Stack direction="row" gap={1}>
          <Button
            variant="contained"
            onClick={() => dispatch(DIALOG_TYPE.PROGRAM_CREATE)}
          >
            Create Program
          </Button>
          <Button
            variant="contained"
            onClick={() => dispatch(DIALOG_TYPE.PROGRAM_EDIT)}
          >
            Edit Program
          </Button>
        </Stack>
      </Section>

      <Section header={{ title: 'Course' }}>
        <Stack direction="row" gap={1}>
          <Button
            variant="contained"
            onClick={() => dispatch(DIALOG_TYPE.COURSE_CREATE)}
          >
            Create Course
          </Button>
          <Button
            variant="contained"
            onClick={() => dispatch(DIALOG_TYPE.COURSE_EDIT)}
          >
            Edit Course
          </Button>
        </Stack>
      </Section>

      <Section header={{ title: 'Import' }}>
        <Stack direction="row" gap={1}>
          <Button
            variant="contained"
            onClick={() => dispatch(DIALOG_TYPE.IMPORT_OUTCOMES)}
          >
            Import outcomes
          </Button>
          <Button
            variant="contained"
            onClick={() => dispatch(DIALOG_TYPE.IMPORT_NODES)}
          >
            Import nodes
          </Button>
        </Stack>
      </Section>

      <Section header={{ title: 'Add contributor' }}>
        <Stack direction="row" gap={1}>
          <Button
            variant="contained"
            onClick={() => dispatch(DIALOG_TYPE.ADD_CONTRIBUTOR)}
          >
            Add Contributor
          </Button>
        </Stack>
      </Section>
    </>
  )
}

export default SectionDialogs
