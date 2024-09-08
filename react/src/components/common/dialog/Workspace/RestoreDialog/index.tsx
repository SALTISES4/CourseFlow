import { StyledDialog } from '@cf/components/common/dialog/styles'
import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { DIALOG_TYPE, useDialog } from '@cf/hooks/useDialog'
import { WorkSpaceType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { useMutation } from '@tanstack/react-query'
import { unarchiveSelfMutation } from '@XMLHTTP/API/workflow'
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
    DIALOG_TYPE.PROJECT_RESTORE,
    DIALOG_TYPE.WORKFLOW_RESTORE
  ])

  const { mutate } = useMutation<EmptyPostResp>({
    mutationFn: () =>
      unarchiveSelfMutation(context.workflow.workflowId, resourceType),
    onSuccess: (resp) => {
      enqueueSnackbar(
        COURSEFLOW_APP.globalContextData.strings.workflow_unarchive_success,
        {
          variant: 'success'
        }
      )
      onClose()
    },
    onError: (error) => {
      console.log(error)
      enqueueSnackbar(
        COURSEFLOW_APP.globalContextData.strings.workflow_unarchive_failure,
        {
          variant: 'error'
        }
      )
    }
  })

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  function onSubmitHandler() {
    mutate()
  }

  /*******************************************************
   * CONSTANTS
   *******************************************************/

  let resourceType: WorkSpaceType = null
  switch (type) {
    case DIALOG_TYPE.PROJECT_RESTORE:
      resourceType = WorkSpaceType.PROJECT
      break
    case DIALOG_TYPE.WORKFLOW_RESTORE:
      resourceType = WorkSpaceType.WORKFLOW
      break
  }

  /*******************************************************
   * RENDER
   *******************************************************/
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
          Do you want to restore your {resourceType}?
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmitHandler}>
          Restore {resourceType}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ArchiveDialog
