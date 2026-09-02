import { deleteChannel } from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import type { AppDispatch } from '@cf/redux/store'
import { StyledDialog } from '@cfComponents/dialog/styles'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'

const DeleteWorkflowNodeCategory = () => {
  const { t } = useTranslation('workflow')
  const { t: tCommon } = useTranslation('common')
  const dispatch = useDispatch<AppDispatch>()
  const { payload, show, onClose } = useDialog(
    DialogMode.WORKFLOW_DELETE_NODE_CATEGORY
  )

  const onSubmit = useCallback(() => {
    if (payload?.uuid && payload?.graphUuid) {
      dispatch(
        deleteChannel({
          graphUuid: payload.graphUuid,
          channelUuid: payload.uuid
        })
      )
    }
    onClose()
  }, [dispatch, onClose, payload])

  return (
    <StyledDialog
      open={!!show}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby={`delete-section-node-category-modal`}
    >
      <DialogTitle id={`delete-section-node-category-modal`}>
        {t('deleteNodeCategory.title')}
      </DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          {t('deleteNodeCategory.warning')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          {tCommon('actions.cancel')}
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          {t('deleteNodeCategory.submit')}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default DeleteWorkflowNodeCategory
