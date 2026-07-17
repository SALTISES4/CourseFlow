import { createProjectMutation } from '@cf/api/gen/@tanstack/react-query.gen'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { CFRoutes } from '@cf/router/appRoutes'
import { _t } from '@cf/utility/Utility.class'
import ProjectForm, {
  ProjectFormValues
} from '@cfComponents/dialog/Project/components/ProjectForm'
import * as SC from '@cfComponents/dialog/styles'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { generatePath, useNavigate } from 'react-router-dom'

const defaultValues: ProjectFormValues = {
  title: '',
  description: '',
  disciplines: []
}

type PropsType = {
  showNoProjectsAlert: boolean
}

const ProjectCreateDialog = ({ showNoProjectsAlert = false }: PropsType) => {
  const { show, onClose } = useDialog(DialogMode.PROJECT_CREATE)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const createProject = useMutation({
    ...createProjectMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['getMyProjects']
      })
    }
  })

  function onSuccess(uuid: string) {
    const path = generatePath(CFRoutes.PROJECT, { uuid })
    onDialogClose()
    navigate(path)
    enqueueSnackbar(_t('Project created'), { variant: 'success' })
  }

  function onError(error) {
    enqueueSnackbar(
      _t('We encountered an issue and your project was not created'),
      { variant: 'error' }
    )
    // this won't work because we're getting back errors from the serializer
    // but it's a start
    console.error('Error creating project:', error)
    // setErrors(error.name)
  }

  const onSubmit = async (data: ProjectFormValues) => {
    try {
      const response = await createProject.mutateAsync({
        body: data
      })

      onSuccess(String(response.uuid))
    } catch (err) {
      onError(err)
    }
  }

  function onDialogClose() {
    onClose()
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  return (
    <SC.StyledDialog
      open={show}
      onClose={onDialogClose}
      fullWidth
      maxWidth="sm"
    >
      <ProjectForm
        defaultValues={defaultValues}
        submitHandler={onSubmit}
        closeCallback={onDialogClose}
        showNoProjectsAlert={showNoProjectsAlert}
        label={_t('Create project')}
        submitLabel={_t('Create project')}
      />
    </SC.StyledDialog>
  )
}

export default ProjectCreateDialog
