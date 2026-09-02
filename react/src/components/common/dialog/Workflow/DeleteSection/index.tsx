import { deleteSection } from '@cf/features/graph/state/thunks/graphMutations.thunks'
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

const DeleteWorkflowSection = () => {
  const { t } = useTranslation('workflow')
  const { t: tCommon } = useTranslation('common')
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
        {t('deleteSection.title')}
      </DialogTitle>
      <DialogContent dividers>
        <Typography gutterBottom>
          {t('deleteSection.warning')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          {tCommon('actions.cancel')}
        </Button>
        <Button variant="contained" onClick={onSubmit}>
          {t('deleteSection.submit')}
        </Button>
      </DialogActions>
    </StyledDialog>
  )
}

export default DeleteWorkflowSection
