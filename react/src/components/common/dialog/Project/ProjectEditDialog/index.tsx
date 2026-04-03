import {
  getProjectOptions,
  getProjectQueryKey,
  listProjectsQueryKey,
  updateProjectMutation
} from '@cf/api/gen/@tanstack/react-query.gen'
import * as SC from '@cf/components/common/dialog/styles'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import ProjectForm from '@cfComponents/dialog/Project/components/ProjectForm'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

type ProjectFormValues = {
  title: string
  description: string
  disciplines: string[]
}

/**
 *
 * @param showNoProjectsAlert
 * @param formFields
 * @constructor
 */
const ProjectEditDialog = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const { show, onClose } = useDialog(DialogMode.PROJECT_EDIT)
  const { uuid } = useParams()
  const projectUuid = uuid ?? ''
  const queryClient = useQueryClient()

  // TODO: grab amount of projects data from elsewhere?
  const noProjects = true

  /*******************************************************
   * QUERY HOOK
   *******************************************************/
  const { data, refetch, isLoading } = useQuery({
    ...getProjectOptions({
      path: {
        uuid: projectUuid as string
      }
    }),
    enabled: Boolean(projectUuid)
  })

  const updateProject = useMutation({
    ...updateProjectMutation(),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: getProjectQueryKey({
          path: { uuid: variables.path.uuid }
        })
      })

      queryClient.invalidateQueries({
        queryKey: listProjectsQueryKey()
      })

      onSuccess({ message: 'Success' }, onSuccessHandler)
    },
    onError: (err) => {
      onError(err)
    }
  })

  const { onError, onSuccess } = useGenericMsgHandler()

  /*******************************************************
   * RHF
   *******************************************************/
  const defaultValues: ProjectFormValues = {
    title: data?.item.title ?? '',
    description: data?.item.description ?? '',
    disciplines: []
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  function onSubmit(formData: ProjectFormValues) {
    updateProject.mutate({
      path: { uuid: projectUuid },
      body: {
        ...formData,
        disciplines: formData.disciplines.map((item) => Number(item))
      }
    })
  }

  function onSuccessHandler() {
    refetch()
    onClose()
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  if (isLoading || !data) {
    return null
  }

  return (
    <SC.StyledDialog open={show} onClose={onClose} fullWidth maxWidth="sm">
      <ProjectForm
        defaultValues={defaultValues}
        submitHandler={onSubmit}
        closeCallback={onClose}
        showNoProjectsAlert={noProjects}
        label={'Edit project'}
        submitLabel={'Update project'}
      />
    </SC.StyledDialog>
  )
}

export default ProjectEditDialog
