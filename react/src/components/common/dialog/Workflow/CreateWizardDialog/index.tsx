import { WorkflowTypeIn } from '@cf/api/gen'
import {
  copyWorkflowMutation,
  createWorkflowMutation,
  listWorkflowsQueryKey
} from '@cf/api/gen/@tanstack/react-query.gen'
import WorkflowForm, {
  WorkflowFormType
} from '@cf/components/common/dialog/Workflow/components/WorkflowForm'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { CFRoutes } from '@cf/router/appRoutes'
import { StyledBox, StyledDialog } from '@cfComponents/dialog/styles'
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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { produce } from 'immer'
import { enqueueSnackbar } from 'notistack'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

type StateType = {
  step: number
  resourceType: CreateResourceOptions
  workflowType?: WorkflowTypeIn
  title?: string
  template?: { uuid: string; title: string }
}

const initialState: StateType = {
  step: 0,
  resourceType: CreateResourceOptions.BLANK
}

const CreateWizardDialog = () => {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, setState] = useState<StateType>(initialState)
  const [projectUuid, setProjectUuid] = useState<string>()
  const [isFormReady, setIsFormReady] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const createWorkflow = useMutation({
    ...createWorkflowMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: listWorkflowsQueryKey()
      })
    }
  })
  const copyWorkflow = useMutation({
    ...copyWorkflowMutation(),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: listWorkflowsQueryKey()
        }),
        queryClient.invalidateQueries({ queryKey: ['library-search'] })
      ])
    }
  })

  const {
    show,
    onClose: onDialogClose,
    type: dialogMode,
    payload
  } = useDialog<DialogMode.WORKFLOW_CREATE>(DialogMode.WORKFLOW_CREATE)

  const steps = [
    {
      label: 'Select project',
      title: 'Select project',
      canSubmit: projectUuid
    },
    {
      label: `Select ${state.workflowType} type`,
      title: `Select ${state.workflowType} type`,
      canSubmit: state.resourceType
    },
    {
      label: `Create ${state.workflowType}`,
      title:
        state.resourceType === CreateResourceOptions.TEMPLATE
          ? `Create ${state.workflowType} from a template`
          : `Create blank ${state.workflowType}`,
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

  function onProjectSelect(uuid?: string) {
    setProjectUuid(uuid)
  }

  function onTypeSelect(resourceType: CreateResourceOptions) {
    setState(
      produce((draft) => {
        draft.resourceType = resourceType
      })
    )
  }

  function onTemplateSelect(template?: { uuid: string; title: string }) {
    setState(
      produce((draft) => {
        draft.template = template
      })
    )
  }
  /*******************************************************
   * FUNCTIONS: form
   *******************************************************/

  const resetState = useCallback(() => {
    setState(initialState)
    setProjectUuid(undefined)
    setIsFormReady(false)
  }, [])

  const onCloseHandler = useCallback(() => {
    onDialogClose()
  }, [onDialogClose])

  const onSuccess = useCallback(
    (uuid: string) => {
      const path = generatePath(CFRoutes.WORKFLOW_GRAPH, { uuid })
      onDialogClose()
      navigate(path)
      enqueueSnackbar(
        `Your ${state.workflowType} has been successfully created`,
        {
          variant: 'success'
        }
      )
    },
    [navigate, onDialogClose, state.workflowType]
  )

  const onError = useCallback(
    (error: unknown) => {
      enqueueSnackbar(
        `We encountered an issue and your ${state.workflowType} was not created`,
        { variant: 'error' }
      )
      console.error('Error creating workflow:', error)
    },
    [state.workflowType]
  )

  const onSubmit = useCallback(
    async (data: WorkflowFormType) => {
      if (!state.workflowType) {
        return
      }

      try {
        const response = await createWorkflow.mutateAsync({
          body: {
            ...(projectUuid ? { projectUuid } : {}),
            title: data.title,
            workflowType: state.workflowType as WorkflowTypeIn,
            description: data.description ?? ''
          }
        })

        onSuccess(String(response.uuid))
      } catch (err) {
        onError(err)
      }
    },
    [createWorkflow, onError, onSuccess, projectUuid, state.workflowType]
  )

  const onTemplateSubmit = useCallback(async () => {
    if (!state.template || !projectUuid) {
      return
    }

    try {
      const response = await copyWorkflow.mutateAsync({
        path: { uuid: state.template.uuid },
        body: {
          projectUuid,
          title: state.template.title
        }
      })
      onSuccess(response.uuid)
    } catch (err) {
      onError(err)
    }
  }, [copyWorkflow, onError, onSuccess, projectUuid, state.template])

  /**
   * Bit of a hack, we want the form to be selfcontained, but we want to submit it conditionally from outside
   * open to a better design pattern here, but do not want to pull form hook into the parent
   * so we pass a ref to the form, then we send the submit event to the form via the ref
   * it's not too bad because RHF does a good job attaching itself to the native form element
   * probably cleaner than useImperativeDeclaration
   */
  function handleChildSubmit() {
    formRef.current?.dispatchEvent(
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
      if (!state.workflowType) {
        return null
      }

      switch (state.step) {
        case 0: {
          return (
            <ProjectSearch
              selected={projectUuid}
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
                label={state.title ?? ctaTitle}
                workflowType={state.workflowType}
                setIsFormReady={setIsFormReady}
              />
            )
          }

          if (state.resourceType === CreateResourceOptions.TEMPLATE) {
            return (
              <TemplateSearch
                selected={state.template?.uuid}
                workflowType={state.workflowType}
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
  }, [
    onSubmit,
    onCloseHandler,
    setIsFormReady,
    state.step,
    state.resourceType,
    state.workflowType,
    state.title,
    state.template,
    projectUuid,
    ctaTitle
  ])

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
            state.step !== steps.length - 1
              ? goToNextStep
              : state.resourceType === CreateResourceOptions.TEMPLATE
                ? onTemplateSubmit
                : handleChildSubmit
          }
          disabled={
            !steps[state.step].canSubmit ||
            createWorkflow.isPending ||
            copyWorkflow.isPending
          }
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
      TransitionProps={{ onExited: resetState }}
    >
      <DialogTitle>{steps[state.step].title}</DialogTitle>
      <DialogContent dividers>
        <Stepper activeStep={state.step}>
          {steps.map((step, idx) => (
            <Step key={step.label} completed={state.step > idx}>
              <StepLabel>{step.label}</StepLabel>
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
