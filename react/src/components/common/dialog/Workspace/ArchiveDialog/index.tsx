import { StyledDialog } from '@cf/components/common/dialog/styles'
import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import { WorkSpaceType } from '@cf/types/enum'
import strings from '@cf/utility/strings'
import { _t } from '@cf/utility/utilityFunctions'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { useMutation } from '@tanstack/react-query'
import { archiveMutation } from '@XMLHTTP/API/workflow'
import { EmptyPostResp } from '@XMLHTTP/types/query'
import { useSnackbar } from 'notistack'
import { useContext } from 'react'

const ArchiveDialog = () => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const context = useContext(WorkFlowConfigContext)

  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const { type, show, onClose } = useDialog([
    DIALOG_TYPE.PROJECT_ARCHIVE,
    DIALOG_TYPE.WORKFLOW_ARCHIVE
  ])

  const { mutate } = useMutation<EmptyPostResp>({
    mutationFn: () =>
      archiveMutation(context.workflow.workflowId, resourceType),
    onSuccess: (resp) => {
      enqueueSnackbar(strings.workflow_archive_success, {
        variant: 'success'
      })
      onClose()
    },
    onError: (error) => {
      console.log(error)
      enqueueSnackbar(strings.workflow_archive_failure, {
        variant: 'error'
      })
    }
  })

  let resourceType: WorkSpaceType = null
  switch (type) {
    case DIALOG_TYPE.PROJECT_ARCHIVE:
      resourceType = WorkSpaceType.PROJECT
      break
    case DIALOG_TYPE.WORKFLOW_ARCHIVE:
      resourceType = WorkSpaceType.WORKFLOW
      break
  }

  function onSubmit() {
    mutate()
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
