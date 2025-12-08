import * as SC from '@cf/components/common/dialog/styles'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { _t } from '@cf/utility/Utility.class'
import ProjectForm from '@cfComponents/dialog/Project/components/ProjectForm'
import { useGetHomeContextQuery } from '@XMLHTTP/API/library.rtk'
import {
  useGetProjectByIdQuery,
  useUpdateProjectMutation
} from '@XMLHTTP/API/project.rtk'
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
  const { id } = useParams()

  // TODO: grab amount of projects data from elsewhere?
  const homeContextQuery = useGetHomeContextQuery()
  const noProjects = homeContextQuery.isLoading
    ? false
    : homeContextQuery.data.dataPackage.projects.length === 0

  /*******************************************************
   * QUERY HOOK
   *******************************************************/
  const { data, refetch, isLoading } = useGetProjectByIdQuery({
    id: Number(id)
  })

  const [mutate, { isSuccess, isError, error, data: updateData }] =
    useUpdateProjectMutation()
  const { onError, onSuccess } = useGenericMsgHandler()

  /*******************************************************
   * RHF
   *******************************************************/
  const defaultValues = {
    title: data.dataPackage.title,
    description: data.dataPackage.description,
    disciplines: data.dataPackage.disciplines.map((item) => {
      return String(item)
    })
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  function onSubmit(data: ProjectFormValues) {
    // remove null value first
    // since the endpoint does not accept them

    const payload = {
      id: Number(id),
      ...data,
      disciplines: data.disciplines.map((item) => Number(item))
    }

    mutate(payload)
      .unwrap()
      .then((response) => {
        onSuccess(response, onSuccessHandler)
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
