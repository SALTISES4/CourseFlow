import { StyledDialog } from '@cf/components/common/dialog/styles'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { _t } from '@cf/utility/utilityFunctions'
import { WorkspaceType } from '@cfPages/Workspace/Workflow/types'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { useUnarchiveMutation } from '@XMLHTTP/API/workspace.rtk'

const RestoreDialog = ({
  objectType,
  id,
  callback
}: {
  id: number
  objectType: WorkspaceType
  callback?: () => void
}) => {
  /*******************************************************
   * HOOKS
   *******************************************************/
  const { show, onClose } = useDialog(DialogMode.RESTORE)
  const [mutate] = useUnarchiveMutation()
  const { onError, onSuccess } = useGenericMsgHandler()

  async function onSuccessHandler() {
    callback && callback
    onClose()
  }

  async function onSubmit() {
    const args = {
      id: Number(id),
      payload: {
        objectType: objectType
      }
    }

    try {
      const resp = await mutate(args).unwrap()
      onSuccess(resp, onSuccessHandler)
      onClose()
    } catch (err) {
      onError(err)
    }
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
      aria-labelledby={`archive-${objectType}-modal`}
    >
      <DialogTitle id={`archive-${objectType}-modal`}>
        Archive {objectType}
      </DialogTitle>

      <DialogContent dividers>
        <Typography gutterBottom>
          Do you want to restore your {objectType}?
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          Restore {objectType}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default RestoreDialog
