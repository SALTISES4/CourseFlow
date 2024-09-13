import Alert from '@cf/components/common/UIPrimitives/Alert'
import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import { _t } from '@cf/utility/utilityFunctions'
import { ActivityFormDataType } from '@cfComponents/dialog/common/CreateWizardDialog/components/FormActivity/types'
import { StyledDialog } from '@cfComponents/dialog/styles'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { produce } from 'immer'
import { ChangeEvent, useState } from 'react'

type StateType = Omit<ActivityFormDataType, 'units'> & {
  unit: string
}

const GenericDialog = (data: ActivityFormDataType) => {
  const initialState: StateType = {
    title: data.title,
    description: data.description,
    duration: data.duration,
    unit: data.units.find((u) => u.selected)?.value || ''
  }

  const [state, setState] = useState<StateType>(initialState)
  const { show, onClose } = useDialog(DIALOG_TYPE.GENERIC)

  function onInfoChange(e: ChangeEvent<HTMLInputElement>) {
    const property = e.target.name as keyof StateType
    setState(
      produce((draft) => {
        draft[property] = e.target.value
      })
    )
  }

  function resetState() {
    setState(initialState)
  }

  function onSubmit() {
    console.log('submitting EDIT ACTIVITY with', state)
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
      <DialogTitle>Edit activity</DialogTitle>
      <DialogContent dividers>
        <Alert
          sx={{ mt: 3 }}
          severity="update"
          title={'THIS IS A PLACEHOLDER '}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          Update
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default GenericDialog
