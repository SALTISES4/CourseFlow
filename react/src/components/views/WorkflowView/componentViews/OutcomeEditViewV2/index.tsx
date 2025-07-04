import { OuterContentWrap } from '@cf/mui/helper'
import { addOutcome } from '@cf/redux/slices/outcomes.slice'
import { _t } from '@cf/utility/Utility.class'
import Alert from '@cfComponents/UIPrimitives/Alert'
import { AppState } from '@cfRedux/types/type'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import OutcomeGroup from './components/OutcomeGroup'

const OutcomeEditView = () => {
  const dispatch = useDispatch()
  const workflow = useSelector((state: AppState) => state.workflow)
  const outcomes = useSelector((state: AppState) => state.outcomes)

  const onAddNewClick = useCallback(() => {
    const newId = outcomes.length ? outcomes[outcomes.length - 1].id + 1 : 1
    dispatch(
      addOutcome({
        id: newId,
        title: 'Blank Outcome title'
      })
    )
  }, [dispatch, outcomes])

  return (
    <OuterContentWrap id={`#workflow-${workflow.id}`} sx={{ pt: 4 }}>
      {!outcomes.length ? (
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
        <OutcomeGroup outcomes={outcomes} />
      )}

      <Box sx={{ mt: 3 }}>
        <Button color="primary" variant="contained" onClick={onAddNewClick}>
          {_t('Add outcome group')}
        </Button>
      </Box>
    </OuterContentWrap>
  )
}

export default OutcomeEditView
