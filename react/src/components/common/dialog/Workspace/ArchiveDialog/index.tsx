import { StyledDialog } from '@cf/components/common/dialog/styles'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { WorkSpaceType } from '@cf/types/enum'
import strings from '@cf/utility/strings'
import { _t } from '@cf/utility/utilityFunctions'
import { AppState } from '@cfRedux/types/type'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { useArchiveMutation } from '@XMLHTTP/API/workflow.rtk'
import { useSnackbar } from 'notistack'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'

const ArchiveDialog = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/

  const workflow = useSelector((state: AppState) => state.workflow)

  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const { type, show, onClose } = useDialog([
    DialogMode.PROJECT_ARCHIVE,
    DialogMode.WORKFLOW_ARCHIVE
  ])

  const [mutate, { isError, isSuccess, error }] = useArchiveMutation()

  function onSuccess() {
    enqueueSnackbar(strings.workflow_archive_success, {
      variant: 'success'
    })
    onClose()
  }

  function onError(error) {
    console.log(error)
    enqueueSnackbar(strings.workflow_archive_failure, {
      variant: 'error'
    })
  }

  useEffect(() => {
    isError && onError(error)
    isSuccess && onSuccess()
  }, [isError, isSuccess, error])

  let resourceType: WorkSpaceType = null
  switch (type) {
    case DialogMode.PROJECT_ARCHIVE:
      resourceType = WorkSpaceType.PROJECT
      break
    case DialogMode.WORKFLOW_ARCHIVE:
      resourceType = WorkSpaceType.WORKFLOW
      break
  }

  function onSubmit() {
    mutate({
      id: workflow.id,
      payload: {
        objectType: resourceType
      }
    })
  }

  if (!type) return <></>

  return (
    <StyledDialog
      open={!!show}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby={`archive-${resourceType}-modal`}
    >
      <DialogTitle id={`archive-${resourceType}-modal`}>
        Archive {resourceType}
      </DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          Once your {resourceType} is archived, it won’t be visible from your
          library. You will have to navigate to your archived project to access
          it. From there, you will be able to restore your project if needed.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          Archive {resourceType}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ArchiveDialog
