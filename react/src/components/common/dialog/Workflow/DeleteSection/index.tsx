import { StyledDialog } from '@cf/components/common/dialog/styles'
import { deleteSection } from '@cf/features/graph/state/thunks/graphMutations.thunks'
import { DialogMode, useDialog } from '@cf/hooks/useDialog'
import type { AppDispatch } from '@cf/redux/store'
import { _t } from '@cf/utility/Utility.class'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

const DeleteWorkflowSection = () => {
  const dispatch = useDispatch<AppDispatch>()
  /*******************************************************
   * HOOKS
   *******************************************************/
  const { payload, show, onClose } = useDialog(DialogMode.GRAPH_DELETE_SECTION)

  const onSubmit = useCallback(() => {
    if (payload?.sectionId && payload?.graphUuid) {
      dispatch(
        deleteSection({
          graphUuid: payload.graphUuid,
          sectionUuid: payload.sectionId
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
      aria-labelledby={`delete-section-part-modal`}
    >
      <DialogTitle id={`delete-section-part-modal`}>
        {_t('You are about to delete a section')}
      </DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          {_t(
            'By deleting this section, you will deleted all nodes which have been added to the section. Are you sure you want to proceed?'
          )}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          {_t('Cancel')}
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          {_t('Delete section')}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default DeleteWorkflowSection
