import {
  getProjectOptions,
  getProjectQueryKey,
  listProjectsQueryKey,
  updateProjectMutation
} from '@cf/api/gen/@tanstack/react-query.gen'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { _t } from '@cf/utility/Utility.class'
import ProjectForm from '@cfComponents/dialog/Project/components/ProjectForm'
import { ProjectFormValues } from '@cfComponents/dialog/Project/components/ProjectForm'
import * as SC from '@cfComponents/dialog/styles'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useParams } from 'react-router-dom'

const ProjectEditDialog = () => {
  const { show, onClose } = useDialog(DialogMode.PROJECT_EDIT)
  const { uuid } = useParams()
  const projectUuid = uuid ?? ''
  const queryClient = useQueryClient()

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

      onSuccess(
        { message: _t('Your project has been successfully updated') },
        () => {
          refetch()
          onClose()
        }
      )
    },
    onError: (err) => {
      onError(err)
    }
  })

  const { onError, onSuccess } = useGenericMsgHandler()

  const defaultValues: ProjectFormValues = {
    title: data?.item.title ?? '',
    description: data?.item.description ?? '',
    disciplines: data?.item.disciplines?.map((d) => d.id) ?? []
  }

  const onSubmit = useCallback(
    (formData: ProjectFormValues) => {
      console.log('updating with', formData)
      updateProject.mutate({
        path: { uuid: projectUuid },
        body: formData
      })
    },
    [projectUuid, updateProject]
  )

  if (isLoading || !data) {
    return null
  }

  return (
    <SC.StyledDialog open={show} onClose={onClose} fullWidth maxWidth="sm">
      <ProjectForm
        defaultValues={defaultValues}
        submitHandler={onSubmit}
        closeCallback={onClose}
        showNoProjectsAlert={false}
        label={_t('Edit project')}
        submitLabel={_t('Update project')}
      />
    </SC.StyledDialog>
  )
}

export default ProjectEditDialog
