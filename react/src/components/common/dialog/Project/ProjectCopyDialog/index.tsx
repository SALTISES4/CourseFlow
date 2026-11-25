import {
  copyProjectMutation,
  getProjectQueryKey,
  listProjectsQueryKey
} from '@cf/api/gen/@tanstack/react-query.gen'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { CFRoutes } from '@cf/router/appRoutes'
import { StyledBox, StyledDialog } from '@cfComponents/dialog/styles'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import TextField from '@mui/material/TextField'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { generatePath, useNavigate } from 'react-router-dom'

const MAX_PROJECT_TITLE_LENGTH = 200

type ProjectCopyDialogProps = {
  sourceProjectUuid: string
  sourceProjectTitle: string
}

const ProjectCopyDialog = ({
  sourceProjectUuid,
  sourceProjectTitle
}: ProjectCopyDialogProps) => {
  const { t } = useTranslation('project')
  const { t: tCommon } = useTranslation('common')
  const { show, onClose } = useDialog(DialogMode.PROJECT_COPY)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [includeArchivedWorkflows, setIncludeArchivedWorkflows] =
    useState(false)

  const defaultTitle = useMemo(() => {
    const suffix = t('copyDialog.titleSuffix')
    const sourceLimit = Math.max(0, MAX_PROJECT_TITLE_LENGTH - suffix.length)
    return `${sourceProjectTitle.slice(0, sourceLimit).trimEnd()}${suffix}`
  }, [sourceProjectTitle, t])

  useEffect(() => {
    if (show) {
      setTitle(defaultTitle)
      setIncludeArchivedWorkflows(false)
    }
  }, [defaultTitle, show])

  const cleanTitle = title.trim()
  const titleError = !cleanTitle
    ? t('form.titleRequired')
    : cleanTitle.length > MAX_PROJECT_TITLE_LENGTH
      ? t('form.titleMax', { count: MAX_PROJECT_TITLE_LENGTH })
      : ''

  const copyProject = useMutation({
    ...copyProjectMutation(),
    onSuccess: (copiedProject) => {
      queryClient.setQueryData(
        getProjectQueryKey({ path: { uuid: copiedProject.uuid } }),
        { item: copiedProject }
      )
      void queryClient.invalidateQueries({ queryKey: listProjectsQueryKey() })
      void queryClient.invalidateQueries({ queryKey: ['library-search'] })
      void queryClient.invalidateQueries({ queryKey: ['getMyProjects'] })

      onClose()
      enqueueSnackbar(t('messages.copied'), { variant: 'success' })
      navigate(generatePath(CFRoutes.PROJECT, { uuid: copiedProject.uuid }))
    },
    onError: () => {
      enqueueSnackbar(t('messages.copyFailed'), { variant: 'error' })
    }
  })

  const closeDialog = () => {
    if (!copyProject.isPending) {
      onClose()
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (titleError || copyProject.isPending) {
      return
    }

    copyProject.mutate({
      path: { uuid: sourceProjectUuid },
      body: {
        title: cleanTitle,
        includeArchivedWorkflows
      }
    })
  }

  return (
    <StyledDialog
      open={show}
      onClose={closeDialog}
      fullWidth
      maxWidth="sm"
      data-test-id="copy-project-dialog"
    >
      <form onSubmit={submit} data-test-id="copy-project-form">
        <DialogTitle data-test-id="copy-project-dialog-title">
          {t('copyDialog.title')}
        </DialogTitle>
        <DialogContent dividers>
          <StyledBox>
            <TextField
              name="title"
              variant="standard"
              required
              autoFocus
              fullWidth
              label={t('form.title')}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              error={Boolean(titleError)}
              helperText={titleError}
              inputProps={{
                maxLength: MAX_PROJECT_TITLE_LENGTH + 1,
                'data-test-id': 'copy-project-title-field'
              }}
            />
            <div>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeArchivedWorkflows}
                    onChange={(event) =>
                      setIncludeArchivedWorkflows(event.target.checked)
                    }
                    data-test-id="copy-project-include-archived-checkbox"
                  />
                }
                label={t('copyDialog.includeArchivedWorkflows')}
              />
              <FormHelperText data-test-id="copy-project-include-archived-help">
                {t('copyDialog.includeArchivedWorkflowsHelp')}
              </FormHelperText>
            </div>
          </StyledBox>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="secondary"
            onClick={closeDialog}
            disabled={copyProject.isPending}
            data-test-id="copy-project-cancel-button"
          >
            {tCommon('actions.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={Boolean(titleError) || copyProject.isPending}
            data-test-id="copy-project-submit-button"
          >
            {t('copyDialog.submit')}
          </Button>
        </DialogActions>
      </form>
    </StyledDialog>
  )
}

export default ProjectCopyDialog
