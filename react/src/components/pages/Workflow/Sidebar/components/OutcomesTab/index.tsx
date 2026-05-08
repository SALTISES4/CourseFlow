import Alert from '@cf/components/common/UIPrimitives/Alert'
import { WorkflowViewType } from '@cf/components/pages/Workflow/types'
import { WorkflowConfigContext } from '@cf/context/workFlowConfigContext'
import { selectOutcomeTagGroups } from '@cf/redux/selectors/outcomes.selector'
import { CFRoutes } from '@cf/router/appRoutes'
import { _t } from '@cf/utility/Utility.class'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useCallback, useContext } from 'react'
import { useSelector } from 'react-redux'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import Outcome from './Outcome'
import * as Styled from '../../styles'

const OutcomeTab = () => {
  const { uuid } = useParams()
  const outcomeGroups = useSelector(selectOutcomeTagGroups)
  const context = useContext(WorkflowConfigContext)
  const navigate = useNavigate()

  const goToEditOutcomes = useCallback(() => {
    context.setWorkflowView(WorkflowViewType.OUTCOME_EDIT)
    navigate(generatePath(CFRoutes.WORKFLOW_OUTCOME_EDIT, { uuid }))
  }, [navigate, context, uuid])

  if (!outcomeGroups.length) {
    return (
      <Styled.SidebarInnerWrap>
        <Styled.SidebarContent>
          <Styled.SidebarTitle as="h3" variant="h6">
            {_t('Outcomes')}
          </Styled.SidebarTitle>
          <Alert
            severity="info"
            persistent
            subtitle={
              <>
                {_t(
                  'Add Outcomes by navigating to the "Outcomes" tab of the current workflow to be able to attach them to nodes within this view.'
                )}
              </>
            }
          />
        </Styled.SidebarContent>
        <Styled.SidebarActions>
          <Button
            variant="contained"
            color="primary"
            onClick={goToEditOutcomes}
          >
            {_t('Edit outcomes')}
          </Button>
        </Styled.SidebarActions>
      </Styled.SidebarInnerWrap>
    )
  }

  return (
    <Styled.SidebarInnerWrap>
      <Styled.SidebarContent>
        <Styled.SidebarTitle as="h3" variant="h6">
          {_t('Outcomes')}
        </Styled.SidebarTitle>
        <Typography variant="body2" sx={{ mb: 3 }}>
          {_t(
            'Drag and drop to associate outcomes from parents workflows to outcomes of your current workflow. Click on an outcome to highlight relevant nodes.'
          )}
        </Typography>
        {outcomeGroups.map(
          (group, idx) =>
            !!group.outcomes.length && (
              <Styled.GroupWrap key={idx}>
                <Typography component="h6" variant="body2">
                  {group.title}
                </Typography>
                {group.outcomes.map((id) => (
                  <Outcome key={id} id={id} />
                ))}
              </Styled.GroupWrap>
            )
        )}
      </Styled.SidebarContent>
      <Styled.SidebarActions>
        <Button
          variant="contained"
          color="secondary"
          onClick={goToEditOutcomes}
        >
          {_t('Edit outcomes')}
        </Button>
      </Styled.SidebarActions>
    </Styled.SidebarInnerWrap>
  )
}

export default OutcomeTab
