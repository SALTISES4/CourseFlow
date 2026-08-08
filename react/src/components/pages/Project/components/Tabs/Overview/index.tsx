import {
  getProjectQueryKey,
  updateProjectMutation
} from '@cf/api/gen/@tanstack/react-query.gen'
import { ProjectDetailOut, ProjectPermission } from '@cf/api/gen/types.gen'
import { hasPermission } from '@cf/context/workspacePermissionsContext'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { WorkspaceType } from '@cf/types/enum'
import { SnackbarOptions } from '@cf/utility/constants'
import { _t } from '@cf/utility/Utility.class'
import { StyledDialog } from '@cfComponents/dialog/styles'
import Alert from '@cfComponents/UIPrimitives/Alert'
import { OuterContentWrap } from '@cfMUI/helper'
import * as SC from '@cfViews/WorkflowView/OverviewView/styles'
import UserPermissions from '@cfViews/WorkflowView/OverviewView/UserPermissions'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { useParams } from 'react-router-dom'

import TagsSection from './TagsSection'

const OverviewTab = ({
  description,
  disciplines,
  owner,
  isPublished,
  permissions,
  tags
}: ProjectDetailOut) => {
  const { uuid } = useParams()
  const queryClient = useQueryClient()
  const { dispatch, show, onClose } = useDialog(DialogMode.PROJECT_PUBLISH)
  const canPublish = hasPermission(
    permissions,
    ProjectPermission.PUBLISH_PROJECT
  )
  const visibilityMutation = useMutation(updateProjectMutation())
  const projectQueryKey = getProjectQueryKey({ path: { uuid: uuid ?? '' } })

  const updateVisibility = async (nextPublished: boolean) => {
    try {
      const response = await visibilityMutation.mutateAsync({
        path: { uuid: uuid ?? '' },
        body: {
          isPublished: nextPublished,
          disciplines: (disciplines ?? []).map((discipline) => discipline.id)
        }
      })
      queryClient.setQueryData(projectQueryKey, response)

      if (nextPublished) {
        onClose()
      }

      enqueueSnackbar(
        _t(
          nextPublished
            ? 'Your project has been successfully published'
            : 'Your project has been successfully unpublished'
        ),
        { variant: SnackbarOptions.SUCCESS }
      )
    } catch (error) {
      enqueueSnackbar(
        _t(
          nextPublished
            ? 'We encountered an issue and your project was not published'
            : 'We encountered an issue and your project was not unpublished'
        ),
        { variant: SnackbarOptions.ERROR }
      )
    }
  }

  return (
    <OuterContentWrap sx={{ pt: 4 }} data-test-id="project-overview-view">
      <SC.InfoBlock sx={{ mb: 3 }}>
        <SC.InfoBlockTitle>{_t('Description')}</SC.InfoBlockTitle>
        <SC.InfoBlockContent>{description || _t('-')}</SC.InfoBlockContent>
      </SC.InfoBlock>

      <Grid container>
        <Grid item xs={12}>
          <SC.InfoBlock>
            <SC.InfoBlockTitle>{_t('Disciplines')}</SC.InfoBlockTitle>
            <SC.InfoBlockContent>
              {disciplines?.length
                ? [...disciplines]
                    .sort((a, b) => a.title.localeCompare(b.title))
                    .map((d) => d.title)
                    .join(', ')
                : _t('-')}
            </SC.InfoBlockContent>
          </SC.InfoBlock>
        </Grid>
      </Grid>

      <SC.InfoBlock sx={{ mt: 3 }}>
        <SC.InfoBlockTitle>{_t('Contributors')}</SC.InfoBlockTitle>

        <UserPermissions
          workspaceId={uuid ?? ''}
          owner={owner}
          workspaceType={WorkspaceType.PROJECT}
        />

        <Alert
          sx={{ mt: 2 }}
          severity="info"
          icon={
            isPublished ? (
              <VisibilityOutlinedIcon />
            ) : (
              <VisibilityOffOutlinedIcon />
            )
          }
          title={_t(
            `The project is currently ${isPublished ? 'public' : 'private'}`
          )}
          cta={
            canPublish && (
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                disabled={visibilityMutation.isPending}
                onClick={() => {
                  if (isPublished) {
                    void updateVisibility(false)
                  } else {
                    dispatch(DialogMode.PROJECT_PUBLISH)
                  }
                }}
              >
                {_t(isPublished ? 'Unpublish project' : 'Publish project')}
              </Button>
            )
          }
        />
      </SC.InfoBlock>

      <TagsSection projectUuid={uuid ?? ''} data={tags ?? []} />

      <StyledDialog open={!!show} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>{_t('Publish project')}</DialogTitle>
        <DialogContent dividers>
          <Typography>
            {_t(
              'Publishing this project will make all associated workflows visible to all CourseFlow users. Are you ready to share this content?'
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="secondary"
            disabled={visibilityMutation.isPending}
            onClick={onClose}
          >
            {_t('Cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={visibilityMutation.isPending}
            onClick={() => void updateVisibility(true)}
          >
            {_t('Publish project')}
          </Button>
        </DialogActions>
      </StyledDialog>
    </OuterContentWrap>
  )
}

export default OverviewTab
