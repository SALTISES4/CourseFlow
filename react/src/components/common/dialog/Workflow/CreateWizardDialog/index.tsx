import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { WorkflowType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import { PropsType as TemplateType } from '@cfComponents/cards/WorkflowCardDumb'
import { StyledBox, StyledDialog } from '@cfComponents/dialog/styles'
import WorkflowForm from '@cfComponents/dialog/Workflow/componnets/WorkflowForm'
import ProjectSearch from '@cfComponents/dialog/Workflow/CreateWizardDialog/components/ProjectSearch'
import TemplateSearch from '@cfComponents/dialog/Workflow/CreateWizardDialog/components/TemplateSearch'
import TypeSelect from '@cfComponents/dialog/Workflow/CreateWizardDialog/components/TypeSelect'
import { CreateResourceOptions } from '@cfComponents/dialog/Workflow/CreateWizardDialog/types'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import { produce } from 'immer'
import { useCallback, useEffect, useMemo, useState } from 'react'

type StateType = {
  step: number
  resourceType: CreateResourceOptions
  workflowType?: WorkflowType
  title?: string
  template?: number
}

const initialState: StateType = {
  step: 0,
  resourceType: CreateResourceOptions.BLANK
}

const CreateWizardDialog = () => {
  const [state, setState] = useState<StateType>(initialState)
  const [projectId, setProjectId] = useState<number>()
  const [templates, setTemplateData] = useState<TemplateType[]>(null)
  const [isFormReady, setIsFormReady] = useState<boolean>()

  const {
    show,
    onClose,
    type: dialogMode
  } = useDialog([
    DialogMode.COURSE_CREATE,
    DialogMode.ACTIVITY_CREATE,
    DialogMode.ACTIVITY_CREATE
  ])
  const steps = [
    {
      title: 'Select project',
      canSubmit: projectId
    },
    {
      title: `Select a ${state.workflowType} type`,
      canSubmit: state.resourceType
    },
    {
      title:
        state.resourceType === CreateResourceOptions.TEMPLATE
          ? `Create a ${state.workflowType} from a template`
          : `Create a blank ${state.workflowType}`,
      canSubmit: ((): boolean => {
        if (state.resourceType === CreateResourceOptions.TEMPLATE) {
          return !!state.template
        }
        return isFormReady
      })()
    }
  ]
  const ctaTitle = `Create ${state.workflowType}`

  // @todo still don't think this pattern is ideal
  // i don't think the dialog should 'self configure' based on the dispatch id OR props
  // instead there should be payload on dispatch
  useEffect(() => {
    function getWorkflowTypeFromDialogType(dialogMode: DialogMode) {
      switch (dialogMode) {
        case DialogMode.COURSE_CREATE:
          return WorkflowType.COURSE
        case DialogMode.ACTIVITY_CREATE:
          return WorkflowType.ACTIVITY
        case DialogMode.PROGRAM_CREATE:
          return WorkflowType.PROGRAM
        default:
          return null
      }
    }
    setState(
      produce((draft) => {
        draft.workflowType = getWorkflowTypeFromDialogType(dialogMode)
        draft.title = ctaTitle
      })
    )
  }, [dialogMode, ctaTitle])
  /*******************************************************
   * FUNCTIONS
   *******************************************************/
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
    setProjectId(id)
  }

  function onTypeSelect(resourceType: CreateResourceOptions) {
    setState(
      produce((draft) => {
        draft.resourceType = resourceType
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

  function resetState() {
    setState(initialState)
  }

  function onSubmit() {
    console.log('submitted CREATE COURSE with', state)
  }

  function onCloseHandler() {
    onClose()
  }

  // Inside your parent component
  const memoizedSteps = useMemo(() => {
    {
      switch (state.step) {
        case 0: {
          return (
            <ProjectSearch
              selected={projectId}
              onProjectSelect={onProjectSelect}
            />
          )
        }
        case 1: {
          return (
            <TypeSelect
              resourceLabel={state.workflowType}
              type={state.resourceType}
              onTypeSelect={onTypeSelect}
            />
          )
        }
        case 2: {
          if (state.resourceType === CreateResourceOptions.BLANK) {
            return (
              <WorkflowForm
                submitHandler={onSubmit}
                closeCallback={onCloseHandler}
                label={state.title}
                workflowType={state.workflowType}
                setIsFormReady={setIsFormReady}
              />
            )
          }

          if (state.resourceType === CreateResourceOptions.TEMPLATE) {
            return (
              <TemplateSearch
                selected={state.template}
                setTemplateData={setTemplateData}
                templates={templates}
                onTemplateSelect={onTemplateSelect}
                templateType={'course'}
              />
            )
          }
          return null
        }
        default:
          return null
      }
    }
  }, [onSubmit, onCloseHandler, setIsFormReady])

  /*******************************************************
   * RENDER COMPONENTS
   *******************************************************/
  const mysteps = () => {
    switch (state.step) {
      case 0: {
        return (
          <ProjectSearch
            selected={projectId}
            onProjectSelect={onProjectSelect}
          />
        )
      }
      case 1: {
        return (
          <TypeSelect
            resourceLabel={state.workflowType}
            type={state.resourceType}
            onTypeSelect={onTypeSelect}
          />
        )
      }
      case 2: {
        if (state.resourceType === CreateResourceOptions.BLANK) {
          return (
            <WorkflowForm
              submitHandler={onSubmit}
              closeCallback={onCloseHandler}
              label={state.title}
              workflowType={state.workflowType}
              setIsFormReady={setIsFormReady}
            />
          )
        }

        if (state.resourceType === CreateResourceOptions.TEMPLATE) {
          return (
            <TemplateSearch
              selected={state.template}
              setTemplateData={setTemplateData}
              templates={templates}
              onTemplateSelect={onTemplateSelect}
              templateType={'course'}
            />
          )
        }
        return null
      }
      default:
        return null
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
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
      <DialogTitle>{steps[state.step].title}</DialogTitle>
      <DialogContent dividers>
        <Stepper activeStep={state.step}>
          {steps.map((step, idx) => (
            <Step key={step.title} completed={state.step > idx}>
              <StepLabel>{step.title}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <StyledBox component="form" sx={{ mt: 5 }}>
          {memoizedSteps}
        </StyledBox>
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
          disabled={!steps[state.step].canSubmit}
        >
          {state.step !== steps.length - 1 ? 'Next step' : ctaTitle}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default CreateWizardDialog
