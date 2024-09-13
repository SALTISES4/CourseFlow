import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import { CFRoutes } from '@cf/router'
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
import { createProject } from '@XMLHTTP/API/project'
import { CreateProjectArgs } from '@XMLHTTP/types/args'
import { CreateProjectResp } from '@XMLHTTP/types/query'
import { produce } from 'immer'
import { enqueueSnackbar } from 'notistack'
import { ChangeEvent, useState } from 'react'
import { useSelector } from 'react-redux'
import { generatePath, useNavigate } from 'react-router-dom'

type StateType = Omit<ActivityFormDataType, 'units'> & {
  unit: string
}

const ActivityEditDialog = (data: ActivityFormDataType) => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const workflow = useSelector((state: AppState) => state.workflow)
  const navigate = useNavigate()
  const initialState: StateType = {
    title: workflow.title,
    description: workflow.description,
    duration: data.duration,
    unit: data.units.find((u) => u.selected)?.value || ''
  }

  const [state, setState] = useState<StateType>(initialState)
  const { show, onClose } = useDialog(DIALOG_TYPE.ACTIVITY_EDIT)

  /*******************************************************
   * QUERIES
   *******************************************************/
  const { mutate } = useMutation<CreateProjectResp, Error, CreateProjectArgs>({
    mutationFn: createProject,
    onSuccess: (resp: CreateProjectResp) => {
      const path = generatePath(CFRoutes.PROJECT, {
        id: String(resp.data_package.id)
      })
      // onDialogClose()
      navigate(path)
      enqueueSnackbar('created project success', {
        variant: 'success'
      })
    },
    onError: (error) => {
      enqueueSnackbar('created project error', {
        variant: 'error'
      })
      // this won't work because we're getting back errors from the serializer
      // but it's a start
      console.error('Error creating project:', error)
      // setErrors(error.name)
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
        draft.unit = e.target.value
      })
    )
  }

  function resetState() {
    setState(initialState)
  }

  function onSubmit() {
    console.log('submitting EDIT ACTIVITY with', state)
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
          Update activity
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ActivityEditDialog
