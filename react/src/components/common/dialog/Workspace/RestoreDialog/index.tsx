import { StyledDialog } from '@cf/components/common/dialog/styles'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { WorkSpaceType } from '@cf/types/enum'
import strings from '@cf/utility/strings'
import { _t } from '@cf/utility/utilityFunctions'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { useUnarchiveMutation } from '@XMLHTTP/API/workflow.rtk'
import { useSnackbar } from 'notistack'
import { useEffect } from 'react'

const RestoreDialog = ({
  objectType,
  id
}: {
  id: number
  objectType: WorkSpaceType
}) => {
  /*******************************************************
   * HOOKS
   *******************************************************/

  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const { type, show, onClose } = useDialog([DialogMode.RESTORE])

  const [mutate, { isLoading, data, isError, isSuccess, error }] =
    useUnarchiveMutation()

  function onError(error) {
    console.log(error)
    enqueueSnackbar(strings.workflow_unarchive_failure, {
      variant: 'error'
    })
  }

  function onSuccess() {
    enqueueSnackbar(strings.workflow_unarchive_success, {
      variant: 'success'
    })
    onClose()
  }

  useEffect(() => {
    if (isSuccess) {
      onSuccess()
    }
    if (isError && error) {
      onError(error)
    }
  }, [isSuccess, isError, error])

  /*******************************************************
   * FUNCTIONS
   *******************************************************/
  function onSubmitHandler() {
    mutate({
      id,
      payload: {
        objectType: objectType
      }
    })
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
        <Button variant="contained" onClick={onSubmitHandler}>
          Restore {objectType}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default RestoreDialog
