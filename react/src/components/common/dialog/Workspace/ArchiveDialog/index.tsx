import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { WorkspaceType } from '@cf/types/enum'
import { StyledDialog } from '@cfComponents/dialog/styles'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'

const ArchiveDialog = ({
  objectType,
  uuid,
  callback
}: {
  uuid: string
  objectType: WorkspaceType
  callback?: () => void
}) => {
  // TODO: reimplement
  return null

  /*******************************************************
   * HOOKS
   *******************************************************/
  const { type, show, onClose } = useDialog(DialogMode.ARCHIVE)

  // @todo replace
  const [mutate] = useArchiveMutation()

  const { onError, onSuccess } = useGenericMsgHandler()

  async function onSuccessHandler() {
    callback && callback
    onClose()
  }
  async function onSubmit() {
    try {
      const resp = await mutate({
        uuid: String(uuid),
        payload: {
          objectType: objectType
        }
      }).unwrap()
      onSuccess(resp)
      callback && callback
    } catch (err) {
      onError(err)
    }
  }

  /*******************************************************
   * RENDER
   *******************************************************/
  if (!type) {
    return <></>
  }

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
          Once your {objectType} is archived, it won’t be visible from your
          library. You will have to navigate to your archived project to access
          it. From there, you will be able to restore your project if needed.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          Archive {objectType}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ArchiveDialog
