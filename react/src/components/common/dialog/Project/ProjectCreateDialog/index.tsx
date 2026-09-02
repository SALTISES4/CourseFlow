import { LibraryContentTypeIn, LibraryOwnershipIn } from '@cf/api/gen'
import { createProjectMutation } from '@cf/api/gen/@tanstack/react-query.gen'
import { useLibrarySearch } from '@cf/api/wrappedHooks'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { CFRoutes } from '@cf/router/appRoutes'
import ProjectForm, {
  ProjectFormValues
} from '@cfComponents/dialog/Project/components/ProjectForm'
import * as SC from '@cfComponents/dialog/styles'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('project')
  const { show, onClose } = useDialog(DialogMode.PROJECT_CREATE)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: ownedProjects, isLoading: ownedProjectsLoading } =
    useLibrarySearch({
      pagination: {
        page: 0,
        resultsPerPage: 1
      },
      filters: {
        contentType: LibraryContentTypeIn.PROJECT,
        ownership: LibraryOwnershipIn.OWNED
      }
    })

  const createProject = useMutation({
    ...createProjectMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['getMyProjects']
      })
      await queryClient.invalidateQueries({
        queryKey: ['library-search']
      })
    }
  })

  function onSuccess(uuid: string) {
    const path = generatePath(CFRoutes.PROJECT, { uuid })
    onDialogClose()
    navigate(path)
    enqueueSnackbar(t('messages.created'), {
      variant: 'success'
    })
  }

  function onError(error) {
    enqueueSnackbar(
      t('messages.createFailed'),
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
        label={t('actions.create')}
        submitLabel={t('actions.create')}
      />
    </SC.StyledDialog>
  )
}

export default ProjectCreateDialog
