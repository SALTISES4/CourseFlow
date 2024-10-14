import { StyledDialog } from '@cf/components/common/dialog/styles'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import useGenericMsgHandler from '@cf/hooks/useGenericMsgHandler'
import { CfObjectType, WorkspaceType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import {
  WorkspaceDeleteUserArgs,
  useGetUsersForObjectQuery,
  useWorkspaceUserDeleteMutation
} from '@XMLHTTP/API/workspaceUser.rtk'
import { EmptyPostResp } from '@XMLHTTP/types/query'

const ContributorRemoveDialog = ({
  id,
  type
}: {
  id: number
  type: WorkspaceType
}) => {
  const { show, onClose, payload } = useDialog<DialogMode.CONTRIBUTOR_REMOVE>(
    DialogMode.CONTRIBUTOR_REMOVE
  )
  const { onError, onSuccess } = useGenericMsgHandler()

  /*******************************************************
   * QUERIES
   *******************************************************/
  const [mutate] = useWorkspaceUserDeleteMutation()
  const { refetch } = useGetUsersForObjectQuery({
    id,
    payload: {
      objectType: type
    }
  })

  /*******************************************************
   * FUNCTION
   *******************************************************/

  function successHandler(response: EmptyPostResp) {
    onSuccess(response)
    onClose()
    refetch()
  }

  async function onSubmit() {
    const args: WorkspaceDeleteUserArgs = {
      id: Number(id),
      payload: {
        userId: payload.userId,
        type: WorkspaceType.PROJECT
      }
    }

    try {
      const response = await mutate(args).unwrap()
      successHandler(response)
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
          Are you sure you want to remove <strong>{payload?.userName}</strong>?
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
