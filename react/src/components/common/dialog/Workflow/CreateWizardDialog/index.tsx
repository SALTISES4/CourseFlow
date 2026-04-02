import { createWorkflowMutation } from '@cf/api/gen/@tanstack/react-query.gen'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { CFRoutes } from '@cf/router/appRoutes'
import { PropsType as TemplateType } from '@cfComponents/cards/WorkflowCardDumb'
import { StyledBox, StyledDialog } from '@cfComponents/dialog/styles'
import WorkflowForm from '@cfComponents/dialog/Workflow/componnets/WorkflowForm'
import ProjectSearch from '@cfComponents/dialog/Workflow/CreateWizardDialog/components/ProjectSearch'
import TemplateSearch from '@cfComponents/dialog/Workflow/CreateWizardDialog/components/TemplateSearch'
import TypeSelect from '@cfComponents/dialog/Workflow/CreateWizardDialog/components/TypeSelect'
import {
  CreateResourceOptions,
  WorkflowFormType
} from '@cfComponents/dialog/Workflow/CreateWizardDialog/types'
import { WorkflowType } from '@cfPages/Workspace/Workflow/types'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import { useMutation } from '@tanstack/react-query'
import { produce } from 'immer'
import { enqueueSnackbar } from 'notistack'
import { useEffect, useMemo, useRef, useState } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

type StateType = {
  step: number
  resourceType: CreateResourceOptions
  workflowType?: WorkflowType
  title?: string
  template?: string
}

const initialState: StateType = {
  step: 0,
  resourceType: CreateResourceOptions.BLANK
}

const CreateWizardDialog = () => {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, setState] = useState<StateType>(initialState)
  const [projectId, setProjectId] = useState<string>()
  const [templates, setTemplateData] = useState<TemplateType[]>(null)
  const [isFormReady, setIsFormReady] = useState<boolean>()
  const navigate = useNavigate()

  //   const [mutate] = useCreateWorkflowMutation()
  const createWorkflow = useMutation(createWorkflowMutation())

  const {
    show,
    onClose: onDialogClose,
    type: dialogMode,
    payload
  } = useDialog<DialogMode.WORKFLOW_CREATE>(DialogMode.WORKFLOW_CREATE)

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

  /**
   */
  useEffect(() => {
    setState(
      produce((draft) => {
        draft.workflowType = payload?.workflowType
        draft.title = ctaTitle
      })
    )
  }, [dialogMode, ctaTitle, payload])

  /*******************************************************
   * FUNCTIONS: Navigation
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

  function onProjectSelect(id: string) {
    setProjectId(id)
  }

  function onTypeSelect(resourceType: CreateResourceOptions) {
    setState(
      produce((draft) => {
        draft.resourceType = resourceType
      })
    )
  }

  function onTemplateSelect(id: string) {
    setState(
      produce((draft) => {
        draft.template = id
      })
    )
  }
  /*******************************************************
   * FUNCTIONS: form
   *******************************************************/

  function resetState() {
    setState(initialState)
  }

  function onCloseHandler() {
    onDialogClose()
  }

  function onSuccess(id: string) {
    const path = generatePath(CFRoutes.WORKFLOW, {
      uuid: uuid
    })
    onDialogClose()
    navigate(path)
    enqueueSnackbar('created project success', {
      variant: 'success'
    })
  }

  function onError(error) {
    enqueueSnackbar('created project error', {
      variant: 'error'
    })
    // this won't work because we're getting back errors from the serializer
    // but it's a start
    console.error('Error creating project:', error)
    // setErrors(error.name)
  }

  async function onSubmit(data: WorkflowFormType) {
    const payload = {
      projectId: projectId ? Number(projectId) : null,
      type: state.workflowType,
      ...data
    }

    try {
      const response = await createWorkflow.mutateAsync({
        body: payload
      })

      onSuccess(String(response.uuid))
    } catch (err) {
      onError(err)
    }
  }

  /**
   * Bit of a hack, we want the form to be selfcontained, but we want to submit it conditionally from outside
   * open to a better design pattern here, but do not want to pull form hook into the parent
   * so we pass a ref to the form, then we send the submit event to the form via the ref
   * it's not too bad because RHF does a good job attaching itself to the native form element
   * probably cleaner than useImperativeDeclaration
   */
  function handleChildSubmit() {
    formRef.current.dispatchEvent(
      new Event('submit', { cancelable: true, bubbles: true })
    )
  }
  /*******************************************************
   * RENDER COMPONENTS
   *******************************************************/
  /**
   * memoize all steps of the wizard, this is mainly to stop the child
   * form from rerendering when parent state is updated from child (i.e. is dirty)
   */
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
                formRef={formRef}
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
                selected={projectId}
                onTemplateSelect={onTemplateSelect}
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

  const ButtonActions = () => {
    return (
      <>
        <Button variant="contained" color="secondary" onClick={onCloseHandler}>
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
          onClick={
            state.step !== steps.length - 1 ? goToNextStep : handleChildSubmit
          }
          disabled={!steps[state.step].canSubmit}
        >
          {state.step !== steps.length - 1 ? 'Next step' : ctaTitle}
        </Button>
      </>
    )
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <StyledDialog
      open={show}
      fullWidth
      maxWidth="lg"
      onClose={onCloseHandler}
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

        <StyledBox sx={{ mt: 5 }}>{memoizedSteps}</StyledBox>
      </DialogContent>

      <DialogActions>
        <ButtonActions />
      </DialogActions>
    </StyledDialog>
  )
}

export default CreateWizardDialog
