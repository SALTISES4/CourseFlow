import Alert from '@cf/components/common/UIPrimitives/Alert'
import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { selectOutcomeTagGroups } from '@cf/features/graph/state/selectors/outcomes.selectors'
import { CFRoutes } from '@cf/router/appRoutes'
import { _t } from '@cf/utility/Utility.class'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { RootState } from '@cf/redux/store'
import { useSelector } from 'react-redux'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import Outcome from './Outcome'
import * as Styled from '../../styles'

const OutcomeTab = () => {
  const { uuid } = useParams()
  const { data: workflowDetailResp } = useQuery({
    ...getWorkflowOptions({ path: { uuid: uuid! } }),
    enabled: Boolean(uuid)
  })
  const graphUuid = workflowDetailResp?.item?.graphUuid ?? ''
  const outcomeGroups = useSelector((state: RootState) =>
    selectOutcomeTagGroups(state, graphUuid)
  )
  const navigate = useNavigate()

  const goToEditOutcomes = useCallback(() => {
    navigate(generatePath(CFRoutes.WORKFLOW_OUTCOME_EDIT, { uuid }))
  }, [navigate, uuid])

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
                {group.outcomes.map((outcomeUuid) => (
                  <Outcome
                    key={outcomeUuid}
                    graphUuid={graphUuid}
                    uuid={outcomeUuid}
                  />
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
