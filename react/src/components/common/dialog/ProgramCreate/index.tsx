import { ChangeEvent, useState } from 'react'
import { produce } from 'immer'
import { SelectChangeEvent } from '@mui/material/Select'
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import { DIALOG_TYPE, useDialog } from '@cfCommonComponents/dialog'
import { StyledDialog, StyledForm } from '@cfCommonComponents/dialog/styles'

import ProgramForm from '@cfCommonComponents/dialog/CreateWizard/components/FormProgram'
import { ProgramFormDataType } from '@cfCommonComponents/dialog/CreateWizard/components/FormProgram/types'
import TypeSelect from '@cfCommonComponents/dialog/CreateWizard/components/TypeSelect'
import TemplateSearch from '@cfCommonComponents/dialog/CreateWizard/components/TemplateSearch'
import ProjectSearch from '@cfCommonComponents/dialog/CreateWizard/components/ProjectSearch'
import { CREATE_RESOURCE_TYPE } from '@cfCommonComponents/dialog/CreateWizard/types'
import { CreateProgramDataType } from './data'
import { PropsType as ProjectType } from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCardDumb'
import { PropsType as TemplateType } from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCardDumb'


type PropsType = CreateProgramDataType & Pick<ProgramFormDataType, 'units'>

type StateType = {
  step: number
  type: CREATE_RESOURCE_TYPE
  project?: number
  template?: number
  fields: Omit<ProgramFormDataType, 'units'> & {
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

const CreateProgramDialog = ({
  steps,
  units
}: PropsType) => {
  const [state, setState] = useState<StateType>(initialState)
  const { show, onClose } = useDialog(DIALOG_TYPE.PROGRAM_CREATE)
  const [projects,setProjectData] = useState<ProjectType[]>(null)
  const [templates,setTemplateData] = useState<TemplateType[]>(null)

  // dynamic dialog title for each step
  const dialogTitle = [
    'Select a project',
    'Select program type',
    state.type === CREATE_RESOURCE_TYPE.TEMPLATE
      ? 'Create a program from a template'
      : 'Create a blank program'
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
    console.log('submitted CREATE PROGRAM with', state)
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
              setProjectData={setProjectData}
              onProjectSelect={onProjectSelect}
            />
          )}
          {state.step === 1 && (
            <TypeSelect
              resourceLabel="program"
              type={state.type}
              onTypeSelect={onTypeSelect}
            />
          )}
          {state.step === 2 && state.type === CREATE_RESOURCE_TYPE.BLANK && (
            <ProgramForm
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
              setTemplateData={setTemplateData}
              templates={templates}
              onTemplateSelect={onTemplateSelect}
              template_type={"course"}
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
          {state.step !== steps.length - 1 ? 'Next step' : 'Create program'}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default CreateProgramDialog
