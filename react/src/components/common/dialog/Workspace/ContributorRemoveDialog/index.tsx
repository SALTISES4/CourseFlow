import { StyledDialog } from '@cf/components/common/dialog/styles'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { PermissionUserType } from '@cf/types/common'
import { CfObjectType, WorkSpaceType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import {
  WorkspaceDeleteUserArgs,
  WorkspaceUserArgs,
  useWorkspaceUserDeleteMutation
} from '@XMLHTTP/API/workspaceUser.rtk'
import { useParams } from 'react-router-dom'

type PropsType = {
  user: PermissionUserType | null
}

const ContributorRemoveDialog = ({ user }: PropsType) => {
  const { id } = useParams()
  const { show, onClose } = useDialog(DialogMode.CONTRIBUTOR_REMOVE)
  const { onError, onSuccess } = useGenericMsgHandler()

  /*******************************************************
   * QUERIES
   *******************************************************/
  const [mutate] = useWorkspaceUserDeleteMutation()

  /*******************************************************
   * FUNCTION
   *******************************************************/
  async function onSubmit(data: IFormInputs) {
    const args: WorkspaceDeleteUserArgs = {
      id: Number(id),
      payload: {
        userId: data.userId,
        type: WorkSpaceType.PROJECT
      }
    }

    try {
      const response = await mutate(args).unwrap()
      onSuccess(response)
    } catch (err) {
      onError(err)
    }
  }

  /*******************************************************
   *
   *******************************************************/
  return (
    <StyledDialog
      open={!!show}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="remove-user-modal"
    >
      <DialogTitle id="remove-user-modal">Remove user?</DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          Are you sure you want to remove <strong>{user?.name}</strong>?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          Remove
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default ContributorRemoveDialog
