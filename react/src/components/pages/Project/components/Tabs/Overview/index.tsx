import {
  getProjectQueryKey,
  updateProjectMutation
} from '@cf/api/gen/@tanstack/react-query.gen'
import { ProjectPermission } from '@cf/api/gen/types.gen'
import { hasPermission } from '@cf/context/workspacePermissionsContext'
import { ProjectDetailsType } from '@cf/types/common'
import { WorkspaceType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import { OuterContentWrap } from '@cfMUI/helper'
import * as SC from '@cfViews/WorkflowView/OverviewView/styles'
import UserPermissions from '@cfViews/WorkflowView/OverviewView/UserPermissions'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

import TagsSection from './TagsSection'

const OverviewTab = ({
  description,
  disciplines,
  dateCreated,
  tags,
  author,
  isPublished,
  permissions
}: ProjectDetailsType) => {
  const { uuid } = useParams()
  const queryClient = useQueryClient()
  const canPublish = hasPermission(
    permissions,
    ProjectPermission.PUBLISH_PROJECT
  )
  const visibilityMutation = useMutation({
    ...updateProjectMutation(),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: getProjectQueryKey({ path: { uuid: uuid ?? '' } })
      })
  })

  return (
    <OuterContentWrap sx={{ pt: 4 }} data-test-id="project-overview-view">
      {description && (
        <SC.InfoBlock sx={{ mb: 3 }}>
          <SC.InfoBlockTitle>{_t('Description')}</SC.InfoBlockTitle>
          <SC.InfoBlockContent>{description}</SC.InfoBlockContent>
        </SC.InfoBlock>
      )}

      <Grid container columnSpacing={3}>
        <Grid item xs={6}>
          <SC.InfoBlock>
            <SC.InfoBlockTitle>{_t('Disciplines')}</SC.InfoBlockTitle>
            <SC.InfoBlockContent>
              {disciplines?.length
                ? disciplines.map((d) => d.title).join(', ')
                : _t('No disciplines found.')}
            </SC.InfoBlockContent>
          </SC.InfoBlock>
        </Grid>

        <Grid item xs={6}>
          <SC.InfoBlock>
            <SC.InfoBlockTitle>{_t('Created on')}</SC.InfoBlockTitle>
            <SC.InfoBlockContent>{String(dateCreated)}</SC.InfoBlockContent>
          </SC.InfoBlock>
        </Grid>
      </Grid>

      <SC.InfoBlock sx={{ mt: 3 }}>
        <SC.InfoBlockTitle>{_t('Permissions')}</SC.InfoBlockTitle>

        <UserPermissions
          workspaceId={uuid ?? ''}
          author={author}
          workspaceType={WorkspaceType.PROJECT}
        />

        <Stack
          direction="row"
          spacing={2}
          justifyContent="flex-end"
          sx={{ mt: 2 }}
        >
          <SC.InfoBlockContent>
            {_t(
              isPublished
                ? 'The project is currently public'
                : 'The project is currently private'
            )}
          </SC.InfoBlockContent>
          {canPublish && (
            <Button
              size="medium"
              variant="contained"
              color="secondary"
              disabled={visibilityMutation.isPending}
              onClick={() =>
                visibilityMutation.mutate({
                  path: { uuid: uuid ?? '' },
                  body: {
                    isPublished: !isPublished,
                    disciplines: (disciplines ?? []).map(
                      (discipline) => discipline.id
                    )
                  }
                })
              }
            >
              {_t(isPublished ? 'Unpublish project' : 'Publish project')}
            </Button>
          )}
        </Stack>
      </SC.InfoBlock>

      <TagsSection data={tags ?? []} />
    </OuterContentWrap>
  )
}

export default OverviewTab
