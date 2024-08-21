import Section from '@cfComponents/pages/Library/Home/components/Section'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { DIALOG_TYPE, useDialog } from '@cfCommonComponents/dialog'

import ActivityCreateDialog from '@cfCommonComponents/dialog/ActivityCreate'
import createActivityData from '@cfCommonComponents/dialog/ActivityCreate/data'
import ActivityEditDialog from '@cfCommonComponents/dialog/ActivityEdit'
import editActivityData from '@cfCommonComponents/dialog/ActivityEdit/data'

import ProgramCreateDialog from '@cfCommonComponents/dialog/ProgramCreate'
import createProgramData from '@cfCommonComponents/dialog/ProgramCreate/data'
import ProgramEditDialog from '@cfCommonComponents/dialog/ProgramEdit'
import editProgramData from '@cfCommonComponents/dialog/ProgramEdit/data'

import CourseCreateDialog from '@cfCommonComponents/dialog/CourseCreate'
import createCourseData from '@cfCommonComponents/dialog/CourseCreate/data'
import CourseEditDialog from '@cfCommonComponents/dialog/CourseEdit'
import editCourseData from '@cfCommonComponents/dialog/CourseEdit/data'
import CourseArchiveDialog from '@cfCommonComponents/dialog/CourseArchive'

import ContributorAddDialog from '@cfCommonComponents/dialog/ContributorAdd'
import contributorAddData from '@cfCommonComponents/dialog/ContributorAdd/data'

const SectionDialogs = () => {
  const { dispatch } = useDialog()

  return (
    <>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Dialogs
      </Typography>

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

        <ActivityCreateDialog
          {...createActivityData}
          units={editActivityData.units}
        />

        <ActivityEditDialog {...editActivityData} />
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

        <ProgramCreateDialog
          {...createProgramData}
          units={editProgramData.units}
        />

        <ProgramEditDialog {...editProgramData} />
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
          <Button
            variant="contained"
            onClick={() => dispatch(DIALOG_TYPE.COURSE_ARCHIVE)}
          >
            Archive Course
          </Button>
        </Stack>

        <CourseCreateDialog
          {...createCourseData}
          units={editCourseData.units}
        />

        <CourseEditDialog {...editCourseData} />

        <CourseArchiveDialog
          onSubmit={() => console.log('archive project submit')}
        />
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

        <ContributorAddDialog {...contributorAddData} />
      </Section>
    </>
  )
}

export default SectionDialogs
