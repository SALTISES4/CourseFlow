import {
  getProjectQueryKey,
  updateProjectMutation
} from '@cf/api/gen/@tanstack/react-query.gen'
import { ProjectDetailOut, ProjectPermission } from '@cf/api/gen/types.gen'
import { hasPermission } from '@cf/context/workspacePermissionsContext'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { useReferenceLabels } from '@cf/i18n/referenceLabels'
import { WorkspaceType } from '@cf/types/enum'
import { SnackbarOptions } from '@cf/utility/constants'
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
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation('project')
  const { t: tCommon } = useTranslation('common')
  const { uuid } = useParams()
  const queryClient = useQueryClient()
  const { disciplineLabel, collator } = useReferenceLabels()
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
          disciplines: (disciplines ?? []).map((discipline) => discipline.code)
        }
      })
      queryClient.setQueryData(projectQueryKey, response)

      if (nextPublished) {
        onClose()
      }

      enqueueSnackbar(
        nextPublished ? t('messages.published') : t('messages.unpublished'),
        { variant: SnackbarOptions.SUCCESS }
      )
    } catch (error) {
      enqueueSnackbar(
        nextPublished
          ? t('messages.publishFailed')
          : t('messages.unpublishFailed'),
        { variant: SnackbarOptions.ERROR }
      )
    }
  }

  return (
    <OuterContentWrap sx={{ pt: 4 }} data-test-id="project-overview-view">
      <SC.InfoBlock sx={{ mb: 3 }}>
        <SC.InfoBlockTitle>{t('overview.description')}</SC.InfoBlockTitle>
        <SC.InfoBlockContent>
          {description || t('overview.emptyValue')}
        </SC.InfoBlockContent>
      </SC.InfoBlock>

      <Grid container>
        <Grid item xs={12}>
          <SC.InfoBlock>
            <SC.InfoBlockTitle>{t('overview.disciplines')}</SC.InfoBlockTitle>
            <SC.InfoBlockContent>
              {disciplines?.length
                ? [...disciplines]
                    .map((discipline) => disciplineLabel(discipline.code))
                    .sort(collator.compare)
                    .join(', ')
                : t('overview.emptyValue')}
            </SC.InfoBlockContent>
          </SC.InfoBlock>
        </Grid>
      </Grid>

      <SC.InfoBlock sx={{ mt: 3 }}>
        <SC.InfoBlockTitle>{t('overview.contributors')}</SC.InfoBlockTitle>

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
          title={
            isPublished
              ? t('status.currentPublic')
              : t('status.currentPrivate')
          }
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
                {isPublished ? t('actions.unpublish') : t('actions.publish')}
              </Button>
            )
          }
        />
      </SC.InfoBlock>

      <TagsSection projectUuid={uuid ?? ''} data={tags ?? []} />

      <StyledDialog open={!!show} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>{t('actions.publish')}</DialogTitle>
        <DialogContent dividers>
          <Typography>
            {t('overview.publishConfirmation')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="secondary"
            disabled={visibilityMutation.isPending}
            onClick={onClose}
          >
            {tCommon('actions.cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={visibilityMutation.isPending}
            onClick={() => void updateVisibility(true)}
          >
            {t('actions.publish')}
          </Button>
        </DialogActions>
      </StyledDialog>
    </OuterContentWrap>
  )
}

export default OverviewTab
