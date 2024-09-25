import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import { WorkflowType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import { StyledDialog } from '@cfComponents/dialog/styles'
import FormWorkflow, {
  FormField
} from '@cfComponents/dialog/Workflow/CreateWizardDialog/components/FormWorkflow'
import { WorkflowFormType } from '@cfComponents/dialog/Workflow/CreateWizardDialog/types'
import { AppState } from '@cfRedux/types/type'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { SelectChangeEvent } from '@mui/material/Select'
import { useUpdateMutation } from '@XMLHTTP/API/workflow.rtk'
import { produce } from 'immer'
import { enqueueSnackbar } from 'notistack'
import { ChangeEvent, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

type StateType = WorkflowFormType

function configFields(workflow: AppState['workflow']): FormField[] {
  const allFields = [
    FormField.TITLE,
    FormField.DESCRIPTION,
    FormField.PONDERATION,
    FormField.COURSENUMBER,
    FormField.DURATION,
    FormField.UNITS
  ]

  switch (workflow.type) {
    case WorkflowType.ACTIVITY:
      return [
        FormField.TITLE,
        FormField.DESCRIPTION,
        FormField.DURATION,
        FormField.UNITS
      ]
    case WorkflowType.PROGRAM:
      return [
        FormField.TITLE,
        FormField.DESCRIPTION,
        FormField.DURATION,
        FormField.UNITS
      ]
    case WorkflowType.COURSE:
    default:
      return allFields
  }
}

const WorkflowEditDialog = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const { id } = useParams()

  const workflow = useSelector((state: AppState) => state.workflow)

  const config = configFields(workflow)

  const initialState: StateType = {
    title: workflow.title,
    description: workflow.description,
    duration: workflow.timeRequired,
    courseNumber: workflow.code,
    ponderation: {
      theory: String(workflow.ponderationTheory),
      practice: String(workflow.ponderationPractical),
      individual: String(workflow.ponderationIndividual),
      generalEdu: String(workflow.ponderationIndividual),
      specificEdu: String(workflow.ponderationTheory)
    },
    units: String(workflow.timeUnits) ?? '0'
  }

  const [state, setState] = useState<StateType>(initialState)
  const { show, onClose } = useDialog(DIALOG_TYPE.WORKFLOW_EDIT)

  /*******************************************************
   * QUERIES
   *******************************************************/

  const [mutate, { error, isSuccess, isError }] = useUpdateMutation()

  function onSuccess() {
    enqueueSnackbar('edited workflow success', {
      variant: 'success'
    })
    onClose()
  }

  function onError(error) {
    enqueueSnackbar('edited workflow error', {
      variant: 'error'
    })
    console.error('Error updating workflow asdfasdf :', error)
  }

  useEffect(() => {
    isSuccess && onSuccess()
    isError && onError(error)
  }, [error, isSuccess, isError])

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  function onInfoChange(e: ChangeEvent<HTMLInputElement>) {
    const property = e.target.name as keyof Omit<StateType, 'ponderation'>
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
    mutate({
      id: Number(id),
      payload: {
        ...state,
        units: Number(state.units)
      }
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
        <FormWorkflow
          config={config}
          values={state}
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
          Update activity
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default WorkflowEditDialog
