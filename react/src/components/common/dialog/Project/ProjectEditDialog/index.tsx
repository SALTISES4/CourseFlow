import { getProjectOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import * as SC from '@cf/components/common/dialog/styles'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import ProjectForm from '@cfComponents/dialog/Project/components/ProjectForm'
import { useQuery } from '@tanstack/react-query'
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

  // TODO: grab amount of projects data from elsewhere?
  const homeContextQuery = useGetHomeContextQuery()
  const noProjects = homeContextQuery.isLoading
    ? false
    : homeContextQuery.data.dataPackage.projects.length === 0

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

  const [mutate] = useUpdateProjectMutation()
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
    mutate({
      projectUuid,
      ...formData,
      disciplines: formData.disciplines.map((item) => Number(item))
    })
      .unwrap()
      .then(() => {
        onSuccess({ message: 'Success' }, onSuccessHandler)
      })
      .catch((err) => {
        onError(err)
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
