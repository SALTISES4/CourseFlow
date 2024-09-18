// @ts-nocheck
import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import CourseForm from '@cfPages/Styleguide/dialog/CreateWizard/components/FormCourse'
import { CourseFormDataType } from '@cfPages/Styleguide/dialog/CreateWizard/components/FormCourse/types'
import { StyledDialog } from '@cfPages/Styleguide/dialog/styles'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { SelectChangeEvent } from '@mui/material/Select'
import { produce } from 'immer'
import { ChangeEvent, useState } from 'react'

type StateType = Omit<CourseFormDataType, 'units'> & {
  unit: string
}

const EditCourseDialog = (data: CourseFormDataType) => {
  const initialState: StateType = {
    title: data.title,
    description: data.description,
    duration: data.duration,
    courseNumber: data.courseNumber,
    ponderation: data.ponderation,
    unit: data.units.find((u) => u.selected)?.value || ''
  }

  const [state, setState] = useState<StateType>(initialState)
  const { show, onClose } = useDialog(DIALOG_TYPE.COURSE_EDIT)

  function onInfoChange(e: ChangeEvent<HTMLInputElement>) {
    const property = e.target.name as keyof Omit<
      StateType,
      'unit' | 'ponderation'
    >
    setState(
      produce((draft) => {
        draft[property] = e.target.value
      })
    )
  }

  function onUnitChange(e: SelectChangeEvent) {
    setState(
      produce((draft) => {
        draft.unit = e.target.value
      })
    )
  }

  function onPonderationChange(e: ChangeEvent<HTMLInputElement>) {
    const property = e.target.name as keyof StateType['ponderation']
    setState(
      produce((draft) => {
        draft.ponderation[property] = e.target.value
      })
    )
  }

  function resetState() {
    setState(initialState)
  }

  function onSubmit() {
    console.log('submitting EDIT COURSE with', state)
  }

  return (
    <StyledDialog
      open={show}
      fullWidth
      maxWidth="md"
      onClose={onClose}
      TransitionProps={{
        onExited: resetState
      }}
    >
      <DialogTitle>Edit course</DialogTitle>
      <DialogContent dividers>
        <CourseForm
          values={state}
          units={data.units}
          onInfoChange={onInfoChange}
          onPonderationChange={onPonderationChange}
          onUnitChange={onUnitChange}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          Update course
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default EditCourseDialog
