import * as SC from '@cf/components/common/dialog/styles'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { _t } from '@cf/utility/utilityFunctions'
import { ObjectSetType } from '@cfComponents/dialog/Project/components/ObjectSets/type'
import ProjectForm from '@cfComponents/dialog/Project/components/ProjectForm'
import {
  useGetProjectByIdQuery,
  useUpdateProjectMutation
} from '@XMLHTTP/API/project.rtk'
import { enqueueSnackbar } from 'notistack'
import { useParams } from 'react-router-dom'

type ProjectFormValues = {
  title: string
  description: string
  disciplines: string[]
  objectSets: ObjectSetType[]
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

  /*******************************************************
   * QUERY HOOK
   *******************************************************/
  const { data, refetch, isLoading } = useGetProjectByIdQuery({
    id: Number(id)
  })

  const [mutate, { isSuccess, isError, error, data: updateData }] =
    useUpdateProjectMutation()

  function onSuccess(id: string) {
    onDialogClose()
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
   * RHF
   *******************************************************/
  const defaultValues = {
    title: data.dataPackage.title,
    description: data.dataPackage.description,
    disciplines: data.dataPackage.disciplines.map((item) => {
      return String(item)
    }),
    objectSets: data.dataPackage.objectSets.map((item) => {
      return {
        id: item.id,
        term: item.term,
        title: item.title
      }
    })
  }

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  const onSubmit = (data: ProjectFormValues) => {
    // remove null values
    const filteredObjectSets = data.objectSets
      .filter((set) => set.term && set.title)
      .map((item) => ({
        id: item.id,
        title: item.title,
        term: item.term
      }))
    const payload = {
      id: Number(id),
      ...data,
      disciplines: data.disciplines.map((item) => Number(item)),
      objectSets: filteredObjectSets
    }

    mutate(payload)
      .unwrap()
      .then((response) => {
        onSuccess(String(response.dataPackage.id))
        refetch()
      })
      .catch((err) => {
        onError(error)
      })
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
        label={'Edit Project'}
      />
    </SC.StyledDialog>
  )
}

export default ProjectEditDialog
