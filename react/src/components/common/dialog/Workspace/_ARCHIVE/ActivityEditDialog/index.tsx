// @ts-nocheck
import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import { _t } from '@cf/utility/utilityFunctions'
import ActivityForm from '@cfComponents/dialog/common/CreateWizardDialog/components/FormActivity'
import { ActivityFormDataType } from '@cfComponents/dialog/common/CreateWizardDialog/components/FormActivity/types'
import { StyledDialog } from '@cfComponents/dialog/styles'
import { AppState } from '@cfRedux/types/type'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { SelectChangeEvent } from '@mui/material/Select'
import { useMutation } from '@tanstack/react-query'
import { updateMutation } from '@XMLHTTP/API/workflow'
import { UpdateWorkflowArgs } from '@XMLHTTP/types/args'
import { EmptyPostResp } from '@XMLHTTP/types/query'
import { produce } from 'immer'
import { enqueueSnackbar } from 'notistack'
import { ChangeEvent, useState } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

type StateType = ActivityFormDataType

const ActivityEditDialog = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const { id } = useParams()

  const workflow = useSelector((state: AppState) => state.workflow)
  const initialState: StateType = {
    title: workflow.title,
    description: workflow.description,
    duration: workflow.timeRequired,
    units: String(workflow.timeUnits) ?? '0'
  }

  const [state, setState] = useState<StateType>(initialState)
  const { show, onClose } = useDialog(DIALOG_TYPE.ACTIVITY_EDIT)

  /*******************************************************
   * QUERIES
   *******************************************************/
  const { mutate } = useMutation<EmptyPostResp, Error, UpdateWorkflowArgs>({
    mutationFn: (args) => updateMutation(Number(id), args),
    onSuccess: (resp: EmptyPostResp) => {
      enqueueSnackbar('created workflow success', {
        variant: 'success'
      })
      onClose()
    },
    onError: (error) => {
      enqueueSnackbar('created workflow error', {
        variant: 'error'
      })
      console.error('Error updating workflow asdfasdf :', error)
    }
  })

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
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
        draft.units = e.target.value
      })
    )
  }

  function resetState() {
    setState(initialState)
  }

  function onSubmit() {
    mutate({
      ...state,
      units: Number(state.units)
    })
  }

  /*******************************************************
   * RENDER
   *******************************************************/
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
        <ActivityForm
          values={state}
          onInfoChange={onInfoChange}
          onUnitChange={onUnitChange}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          Update activity
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ActivityEditDialog
