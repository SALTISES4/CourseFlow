import type { GraphUuid } from '@cf/features/graph/state/model/types'
import { selectOutcomeChildrenById } from '@cf/features/graph/state/selectors/outcomes.selectors'
import { createOutcome } from '@cf/features/graph/state/thunks/outcomeMutations.thunks'
import type { AppDispatch } from '@cf/redux/store'
import { RootState } from '@cf/redux/store'
import { _t } from '@cf/utility/Utility.class'
import Alert from '@cfComponents/UIPrimitives/Alert'
import { OuterContentWrap } from '@cfMUI/helper'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { memo, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import OutcomeTree from './components/OutcomeTree'

const OutcomeEditView = ({ graphUuid }: { graphUuid: GraphUuid }) => {
  const dispatch = useDispatch<AppDispatch>()
  const outcomes = useSelector((state: RootState) =>
    selectOutcomeChildrenById(state, graphUuid, null)
  )

  const onAddNewOutcome = useCallback(() => {
    dispatch(createOutcome({ graphUuid }))
  }, [dispatch, graphUuid])

  return (
    <OuterContentWrap sx={{ pt: 4 }}>
      {!outcomes.length ? (
        <Box maxWidth="md">
          <Alert
            sx={{ mb: 3 }}
            persistent
            title={_t('How to use outcomes')}
            subtitle={_t(
              'In this view you can add and edit outcomes for this workflow. Once added, outcomes can be attached to nodes within your workflow by navigating to the “Workflow” tab and drag and dropping your outcomes to your nodes from the Outcomes tab of the right sidebar.'
            )}
          />
          <Button color="primary" variant="contained" onClick={onAddNewOutcome}>
            {_t('Add outcome')}
          </Button>
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
