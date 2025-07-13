import { OuterContentWrap } from '@cf/mui/helper'
import { addOutcomeGroup } from '@cf/redux/slices/outcomes.slice'
import { _t } from '@cf/utility/Utility.class'
import Alert from '@cfComponents/UIPrimitives/Alert'
import { AppState } from '@cfRedux/types/type'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import OutcomeGroupWrap from './components/OutcomeGroup'

const OutcomeEditView = () => {
  const dispatch = useDispatch()
  const workflow = useSelector((state: AppState) => state.workflow)
  const outcomeGroups = useSelector((state: AppState) => state.outcomes.groups)

  const onAddNewGroup = useCallback(() => {
    dispatch(addOutcomeGroup('Outcome group label'))
  }, [dispatch])

  return (
    <OuterContentWrap id={`#workflow-${workflow.id}`} sx={{ pt: 4 }}>
      {!outcomeGroups.length ? (
        <Box>
          <Alert
            sx={{ mb: 3 }}
            persistent
            title={_t('How to use outcomes')}
            subtitle={_t(
              'In this view you can add and edit outcomes for this workflow. Once added, outcomes can be attached to nodes within your workflow by navigating to the “Workflow” tab and drag and dropping your outcomes to your nodes from the Outcomes tab of the right sidebar.'
            )}
          />
        </Box>
      ) : (
        <Stack spacing={3} direction="column">
          {outcomeGroups.map((group) => (
            <OutcomeGroupWrap key={group.id} {...group} />
          ))}
        </Stack>
      )}

      <Box sx={{ mt: 3 }}>
        <Button color="primary" variant="contained" onClick={onAddNewGroup}>
          {_t('Add outcome group')}
        </Button>
      </Box>
    </OuterContentWrap>
  )
}

export default OutcomeEditView
