import { ChangeEvent, useState } from 'react'
import { produce } from 'immer'
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import { SelectChangeEvent } from '@mui/material/Select'
import ProgramForm from '@cfCommonComponents/dialog/CreateWizard/components/FormProgram'
import { ProgramFormDataType } from '@cfCommonComponents/dialog/CreateWizard/components/FormProgram/types'
import { DIALOG_TYPE, useDialog } from '@cfCommonComponents/dialog'
import { StyledDialog } from '@cfCommonComponents/dialog/styles'

type StateType = Omit<ProgramFormDataType, 'units'> & {
  unit: string
}

const EditCourseDialog = (data: ProgramFormDataType) => {
  const initialState: StateType = {
    title: data.title,
    description: data.description,
    duration: data.duration,
    unit: data.units.find((u) => u.selected)?.value || ''
  }

  const [state, setState] = useState<StateType>(initialState)
  const { show, onClose } = useDialog(DIALOG_TYPE.PROGRAM_EDIT)

  function onInfoChange(e: ChangeEvent<HTMLInputElement>) {
    const property = e.target.name as keyof StateType
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

  function resetState() {
    setState(initialState)
  }

  function onSubmit() {
    console.log('submitting EDIT PROGRAM with', state)
  }

  return (
    <StyledDialog
      open={show}
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      TransitionProps={{
        onExited: resetState
      }}
    >
      <DialogTitle>Edit program</DialogTitle>
      <DialogContent dividers>
        <ProgramForm
          values={state}
          units={data.units}
          onInfoChange={onInfoChange}
          onUnitChange={onUnitChange}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          Update program
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default EditCourseDialog
