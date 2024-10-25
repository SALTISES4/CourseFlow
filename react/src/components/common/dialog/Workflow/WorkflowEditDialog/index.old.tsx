// @ts-nocheck
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { _t } from '@cf/utility/utilityFunctions'
import { StyledBox, StyledDialog } from '@cfComponents/dialog/styles'
import {
  WorkflowFormType,
  timeUnits
} from '@cfComponents/dialog/Workflow/CreateWizardDialog/types'
import { WorkflowType } from '@cfPages/Workspace/Workflow/types'
import { AppState } from '@cfRedux/types/type'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { FormField } from 'components/common/dialog/Workflow/CreateWizardDialog/components/_ARCHIVE/FormWorkflow'
import { produce } from 'immer'
import { ChangeEvent, useState } from 'react'
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
  const { show, onClose } = useDialog(DialogMode.WORKFLOW_EDIT)
  const { onError, onSuccess } = useGenericMsgHandler()

  /*******************************************************
   * QUERIES
   *******************************************************/

  const [mutate, { error, isSuccess, isError }] = useUpdateMutation()

  async function onSubmit() {
    try {
      const resp = await mutate({
        id: Number(id),
        payload: {
          ...state,
          units: Number(state.units)
        }
      }).unwrap()
      onSuccess(resp)
    } catch (e) {
      onError(e)
    }
  }

  function resetState() {
    setState(initialState)
  }
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
        <StyledBox component={state}>
          {config.includes(FormField.TITLE) && (
            <TextField
              required
              name="title"
              value={state.title}
              variant="standard"
              label="Course title"
              onChange={onInfoChange}
            />
          )}

          {config.includes(FormField.DESCRIPTION) && (
            <TextField
              multiline
              maxRows={3}
              name="description"
              value={state.description}
              variant="standard"
              label="Course description"
              onChange={onInfoChange}
            />
          )}

          {config.includes(FormField.COURSENUMBER) && (
            <TextField
              multiline
              maxRows={3}
              name="courseNumber"
              value={state.courseNumber}
              variant="standard"
              label="Course number"
              onChange={onInfoChange}
            />
          )}

          <Stack direction="row" spacing={2}>
            {config.includes(FormField.DURATION) && (
              <TextField
                fullWidth
                name="duration"
                value={state.duration}
                variant="standard"
                label="Duration"
                onChange={onInfoChange}
              />
            )}
            {config.includes(FormField.UNITS) && (
              <FormControl variant="standard" fullWidth>
                <InputLabel>Unit type</InputLabel>
                <Select
                  value={String(state.units)}
                  label="Unit type"
                  onChange={onUnitChange}
                >
                  {timeUnits.map((u, idx) => (
                    <MenuItem key={idx} value={idx}>
                      {u}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>

          {/*
        Ponderation section only relevant to type 'course' but worth having three separate forms for this
        Workflow currently is one datamodel
      */}
          {config.includes(FormField.PONDERATION) && (
            <>
              <div>
                <Typography sx={{ mt: 1, mb: 1 }}>Ponderation</Typography>
                <Divider />
              </div>
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  name="theory"
                  value={state.ponderation.theory}
                  variant="standard"
                  label="Theory (hrs)"
                  onChange={onPonderationChange}
                />
                <TextField
                  fullWidth
                  name="practice"
                  value={state.ponderation.practice}
                  variant="standard"
                  label="Practice (hrs)"
                  onChange={onPonderationChange}
                />
                <TextField
                  fullWidth
                  name="individual"
                  value={state.ponderation.individual}
                  variant="standard"
                  label="Individual work (hrs)"
                  onChange={onPonderationChange}
                />
                <TextField
                  fullWidth
                  name="generalEdu"
                  value={state.ponderation.generalEdu}
                  variant="standard"
                  label="General education (hrs)"
                  onChange={onPonderationChange}
                />
                <TextField
                  fullWidth
                  name="specificEdu"
                  value={state.ponderation.specificEdu}
                  variant="standard"
                  label="Specific education (hrs)"
                  onChange={onPonderationChange}
                />
              </Stack>
            </>
          )}
        </StyledBox>
        {/*<FormWorkflow*/}
        {/*  config={config}*/}
        {/*  values={state}*/}
        {/*  onInfoChange={onInfoChange}*/}
        {/*  onPonderationChange={onPonderationChange}*/}
        {/*  onUnitChange={onUnitChange}*/}
        {/*/>*/}
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
