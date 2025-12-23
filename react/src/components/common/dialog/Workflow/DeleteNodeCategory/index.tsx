import { StyledDialog } from '@cf/components/common/dialog/styles'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import { columnDeleteSelf } from '@cf/redux/slices/column.slice'
import { _t } from '@cf/utility/Utility.class'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

const DeleteWorkflowNodeCategory = () => {
  const dispatch = useDispatch()
  const { payload, show, onClose } = useDialog(
    DialogMode.WORKFLOW_DELETE_NODE_CATEGORY
  )

  const onSubmit = useCallback(() => {
    dispatch(columnDeleteSelf({ id: payload?.id }))
    onClose()
  }, [dispatch, onClose, payload])

  return (
    <StyledDialog
      open={!!show}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby={`delete-week-node-category-modal`}
    >
      <DialogTitle id={`delete-week-node-category-modal`}>
        {_t('You are about to delete a node category')}
      </DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          {_t(
            'By deleting this node category, you will delete all associated nodes. Are you sure you want to proceed?'
          )}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          {_t('Cancel')}
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          {_t('Delete node category')}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default DeleteWorkflowNodeCategory
