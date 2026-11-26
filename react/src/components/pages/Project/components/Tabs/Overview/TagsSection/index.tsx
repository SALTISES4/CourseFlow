import {
  getProjectQueryKey,
  listProjectTagsQueryKey
} from '@cf/api/gen/@tanstack/react-query.gen'
import {
  createProjectTag,
  deleteProjectTag,
  updateProjectTag
} from '@cf/api/gen/sdk.gen'
import { ProjectPermission, TagListItemOut } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import * as SC from '@cfViews/WorkflowView/OverviewView/styles'
import Grid from '@mui/material/Grid'
import { useQueryClient } from '@tanstack/react-query'
import { produce } from 'immer'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import Tag from './Tag'

type PropsType = {
  projectUuid: string
  data: TagListItemOut[]
}

const Tags = ({ projectUuid, data }: PropsType) => {
  const { t } = useTranslation('project')
  const [state, setState] = useState<TagListItemOut[]>(data)
  const canEdit = useResourcePermission(ProjectPermission.EDIT_PROJECT)
  const queryClient = useQueryClient()

  const syncProjectTags = useCallback(
    (tags: TagListItemOut[]) => {
      const tagsQueryKey = listProjectTagsQueryKey({
        path: { uuid: projectUuid }
      })
      setState(tags)
      queryClient.setQueryData(tagsQueryKey, tags)
      void queryClient.invalidateQueries({ queryKey: tagsQueryKey })
      void queryClient.invalidateQueries({
        queryKey: getProjectQueryKey({ path: { uuid: projectUuid } })
      })
    },
    [projectUuid, queryClient]
  )

  const onChange = useCallback(
    (id: string, value: string, createNew: boolean) => {
      const cleanValue = value.trim()
      if (!cleanValue || !projectUuid) {
        return
      }

      void (async () => {
        if (createNew) {
          const { data: created } = await createProjectTag({
            path: { uuid: projectUuid },
            body: { label: cleanValue },
            throwOnError: true
          })
          syncProjectTags(
            [...state, created].sort((left, right) =>
              left.label.localeCompare(right.label)
            )
          )
          return
        }

        const tagId = Number(id)
        const current = state.find((tag) => tag.id === tagId)
        if (!current || current.label === cleanValue) {
          return
        }
        const { data: updated } = await updateProjectTag({
          path: { uuid: projectUuid, tag_id: tagId },
          body: { label: cleanValue },
          throwOnError: true
        })
        syncProjectTags(
          produce(state, (draft) => {
            const target = draft.find((tag) => tag.id === tagId)
            if (target) {
              target.label = updated.label
            }
          })
        )
      })()
    },
    [projectUuid, state, syncProjectTags]
  )

  const onTagDelete = useCallback(
    (id: string) => {
      const tagId = Number(id)
      void (async () => {
        await deleteProjectTag({
          path: { uuid: projectUuid, tag_id: tagId },
          throwOnError: true
        })
        syncProjectTags(state.filter((tag) => tag.id !== tagId))
      })()
    },
    [projectUuid, state, syncProjectTags]
  )

  if (!state) {
    return
  }

  return (
    <SC.InfoBlock sx={{ mt: 3 }}>
      <SC.InfoBlockTitle>{t('tags.title')}</SC.InfoBlockTitle>

      <SC.InfoBlockContent sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          {state.map((tag) => (
            <Grid item key={tag.id} xs={4}>
              <Tag
                uuid={String(tag.id)}
                label={tag.label}
                disabled={!canEdit}
                onChange={onChange}
                onDelete={onTagDelete}
              />
            </Grid>
          ))}
          {canEdit && (
            <Grid item xs={4}>
              <Tag uuid="new" onChange={onChange} create />
            </Grid>
          )}
        </Grid>
      </SC.InfoBlockContent>
    </SC.InfoBlock>
  )
}

export default Tags
