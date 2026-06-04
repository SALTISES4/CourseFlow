import { createProjectMutation } from '@cf/api/gen/@tanstack/react-query.gen'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { CFRoutes } from '@cf/router/appRoutes'
import ProjectForm, {
  ProjectFormValues
} from '@cfComponents/dialog/Project/components/ProjectForm'
import * as SC from '@cfComponents/dialog/styles'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { generatePath, useNavigate } from 'react-router-dom'

const defaultValues = {
  title: '',
  description: '',
  disciplines: []
}
/**
 *
 * @param showNoProjectsAlert
 * @param formFields
 * @constructor
 */
const ProjectCreateDialog = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const { show, onClose } = useDialog(DialogMode.PROJECT_CREATE)

  const navigate = useNavigate()

  /*******************************************************
   * QUERY HOOK
   *******************************************************/
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

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  const onSubmit = async (data: ProjectFormValues) => {
    try {
      const response = await createProject.mutateAsync({
        ...data,
        disciplines: data.disciplines.map((item) => Number(item))
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
        showNoProjectsAlert={true}
        label={'Create project'}
        submitLabel={'Create project'}
      />
    </SC.StyledDialog>
  )
}

export default ProjectCreateDialog
