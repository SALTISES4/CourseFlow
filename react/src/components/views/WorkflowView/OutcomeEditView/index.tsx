import { WorkflowPermission } from '@cf/api/gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import type { GraphUuid } from '@cf/features/graph/state/model/types'
import { selectOutcomeChildrenById } from '@cf/features/graph/state/selectors/outcomes.selectors'
import { createOutcome } from '@cf/features/graph/state/thunks/outcomeMutations.thunks'
import type { AppDispatch } from '@cf/redux/store'
import { RootState } from '@cf/redux/store'
import Alert from '@cfComponents/UIPrimitives/Alert'
import { OuterContentWrap } from '@cfMUI/helper'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { memo, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'

import OutcomeTree from './components/OutcomeTree'

const OutcomeEditView = ({
  graphUuid,
  publicView = false
}: {
  graphUuid: GraphUuid
  publicView?: boolean
}) => {
  const { t } = useTranslation('workflow')
  const dispatch = useDispatch<AppDispatch>()
  const canManageOutcomes = useResourcePermission(
    WorkflowPermission.OUTCOME_MANAGEMENT
  )
  const outcomes = useSelector((state: RootState) =>
    selectOutcomeChildrenById(state, graphUuid, null)
  )

  const onAddNewOutcome = useCallback(() => {
    if (canManageOutcomes) {
      dispatch(createOutcome({ graphUuid }))
    }
  }, [canManageOutcomes, dispatch, graphUuid])

  return (
    <OuterContentWrap sx={{ pt: 4 }} data-test-id="workflow-outcomes-view">
      {!outcomes.length ? (
        <Box maxWidth="md">
          <Alert
            sx={{ mb: 3 }}
            persistent
            title={t('outcomes.howToTitle')}
            subtitle={t('outcomes.howToHelp')}
          />
          {!publicView && (
            <Button
              color="primary"
              variant="contained"
              disabled={!canManageOutcomes}
              onClick={onAddNewOutcome}
            >
              {t('outcomes.add')}
            </Button>
          )}
        </Box>
      ) : (
        <Stack spacing={3} direction="column">
          <OutcomeTree graphUuid={graphUuid} outcomes={outcomes} />
        </Stack>
      )}
    </OuterContentWrap>
  )
}

export default memo(OutcomeEditView)
