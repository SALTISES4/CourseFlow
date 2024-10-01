import * as SC from '@cf/components/common/dialog/styles'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { CFRoutes } from '@cf/router/appRoutes'
import { _t } from '@cf/utility/utilityFunctions'
import ProjectForm, {
  ProjectFormValues
} from '@cfComponents/dialog/Project/components/ProjectForm'
import { useCreateProjectMutation } from '@XMLHTTP/API/project.rtk'
import { enqueueSnackbar } from 'notistack'
import { generatePath, useNavigate } from 'react-router-dom'

const defaultValues = {
  title: '',
  description: '',
  disciplines: [],
  objectSets: [] // Assuming object sets are part of the form
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
  const [mutate, { isSuccess, isError, error, data: updateData }] =
    useCreateProjectMutation()

  function onSuccess(id: string) {
    const path = generatePath(CFRoutes.PROJECT, {
      id
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

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  const onSubmit = async (data: ProjectFormValues) => {
    // remove null values
    const filteredObjectSets = data.objectSets
      .filter((set) => set.term && set.title)
      .map((item) => ({
        title: item.title,
        term: item.term
      }))
    const payload = {
      ...data,
      disciplines: data.disciplines.map((item) => Number(item)),
      objectSets: filteredObjectSets
    }

    try {
      const response = await mutate(payload).unwrap()
      onSuccess(String(response.dataPackage.id))
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
        label={'Edit Project'}
      />
    </SC.StyledDialog>
  )
}

export default ProjectCreateDialog
