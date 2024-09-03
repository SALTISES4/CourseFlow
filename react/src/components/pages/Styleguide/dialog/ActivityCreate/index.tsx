import { ChangeEvent, useState } from 'react'
import { produce } from 'immer'
import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import { SelectChangeEvent } from '@mui/material/Select'
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import { StyledDialog, StyledForm } from '@cfPages/Styleguide/dialog/styles'

import ActivityForm from '@cfPages/Styleguide/dialog/CreateWizard/components/FormActivity'
import { ActivityFormDataType } from '@cfPages/Styleguide/dialog/CreateWizard/components/FormActivity/types'
import TypeSelect from '@cfPages/Styleguide/dialog/CreateWizard/components/TypeSelect'
import TemplateSearch from '@cfPages/Styleguide/dialog/CreateWizard/components/TemplateSearch'
import ProjectSearch from '@cfPages/Styleguide/dialog/CreateWizard/components/ProjectSearch'
import { CREATE_RESOURCE_TYPE } from '@cfPages/Styleguide/dialog/CreateWizard/types'
import { CreateActivityDataType } from './data'

type PropsType = CreateActivityDataType & Pick<ActivityFormDataType, 'units'>

type StateType = {
  step: number
  type: CREATE_RESOURCE_TYPE
  project?: number
  template?: number
  fields: Omit<ActivityFormDataType, 'units'> & {
    unit: string
  }
}

const initialState: StateType = {
  step: 0,
  type: CREATE_RESOURCE_TYPE.BLANK,
  fields: {
    title: '',
    description: '',
    duration: '',
    unit: ''
  }
}

const CreateActivityDialog = ({
  steps,
  projects,
  templates,
  units
}: PropsType) => {
  const [state, setState] = useState<StateType>(initialState)
  const { show, onClose } = useDialog(DIALOG_TYPE.ACTIVITY_CREATE)

  // dynamic dialog title for each step
  const dialogTitle = [
    'Select a project',
    'Select activity type',
    state.type === CREATE_RESOURCE_TYPE.TEMPLATE
      ? 'Create an activity from a template'
      : 'Create a blank activity'
  ][state.step]

  // each element is a validation condition for that particular step
  const disableSubmit = [
    // step 1: check if project is selected
    !state.project,

    // step 2: and that a type has been selected
    !state.type,

    // step 3: check if the template is selected for when creating from template
    // or if creating manually, check that the title field is added
    state.type === CREATE_RESOURCE_TYPE.TEMPLATE
      ? !state.template
      : state.fields
      ? !state.fields.title
      : true
  ][state.step]

  function goToNextStep() {
    setState(
      produce((draft) => {
        draft.step = Math.min(steps.length, draft.step + 1)
      })
    )
  }

  function goToPreviousStep() {
    setState(
      produce((draft) => {
        draft.step = Math.max(0, draft.step - 1)
      })
    )
  }

  function onProjectSelect(id: number) {
    setState(
      produce((draft) => {
        draft.project = draft.project === id ? undefined : id
      })
    )
  }

  function onTypeSelect(type: CREATE_RESOURCE_TYPE) {
    setState(
      produce((draft) => {
        draft.type = type
      })
    )
  }

  function onTemplateSelect(id: number) {
    setState(
      produce((draft) => {
        draft.template = id
      })
    )
  }

  function onInfoChange(e: ChangeEvent<HTMLInputElement>) {
    const property = e.target.name as keyof Omit<StateType['fields'], 'unit'>
    setState(
      produce((draft) => {
        draft.fields[property] = e.target.value
      })
    )
  }

  function onUnitChange(e: SelectChangeEvent) {
    setState(
      produce((draft) => {
        draft.fields.unit = e.target.value
      })
    )
  }

  function resetState() {
    setState(initialState)
  }

  function onSubmit() {
    console.log('submitted CREATE ACTIVITY with', state)
  }

  return (
    <StyledDialog
      open={show}
      fullWidth
      maxWidth="lg"
      onClose={onClose}
      TransitionProps={{
        onExited: resetState
      }}
    >
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent dividers>
        <Stepper activeStep={state.step}>
          {steps.map((label, idx) => (
            <Step key={label} completed={state.step > idx}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <StyledForm component="form" sx={{ mt: 5 }}>
          {state.step === 0 && (
            <ProjectSearch
              selected={state.project}
              projects={projects}
              onProjectSelect={onProjectSelect}
            />
          )}
          {state.step === 1 && (
            <TypeSelect
              resourceLabel="activity"
              type={state.type}
              onTypeSelect={onTypeSelect}
            />
          )}
          {state.step === 2 && state.type === CREATE_RESOURCE_TYPE.BLANK && (
            <ActivityForm
              wrapAs="div"
              values={state.fields}
              units={units}
              onInfoChange={onInfoChange}
              onUnitChange={onUnitChange}
            />
          )}
          {state.step === 2 && state.type === CREATE_RESOURCE_TYPE.TEMPLATE && (
            <TemplateSearch
              selected={state.template}
              templates={templates}
              onTemplateSelect={onTemplateSelect}
            />
          )}
        </StyledForm>
      </DialogContent>

      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        {!!state.step && (
          <Button
            variant="contained"
            color="secondary"
            onClick={goToPreviousStep}
          >
            Previous step
          </Button>
        )}
        <Button
          variant="contained"
          onClick={state.step !== steps.length - 1 ? goToNextStep : onSubmit}
          disabled={disableSubmit}
        >
          {state.step !== steps.length - 1 ? 'Next step' : 'Create activity'}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default CreateActivityDialog
