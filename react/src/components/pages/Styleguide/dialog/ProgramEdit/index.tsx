// @ts-nocheck
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import ProgramForm from '@cfPages/Styleguide/dialog/CreateWizard/components/FormProgram'
import { ProgramFormDataType } from '@cfPages/Styleguide/dialog/CreateWizard/components/FormProgram/types'
import { StyledDialog } from '@cfPages/Styleguide/dialog/styles'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { SelectChangeEvent } from '@mui/material/Select'
import { produce } from 'immer'
import { ChangeEvent, useState } from 'react'

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
  const { show, onClose } = useDialog(DialogMode.PROGRAM_EDIT)

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
