import {
  getWorkflowOptions,
  listProjectTagsOptions
} from '@cf/api/gen/@tanstack/react-query.gen'
import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import { selectOutcomeTagGroups } from '@cf/features/graph/state/selectors/outcomes.selectors'
import { RootState } from '@cf/redux/store'
import { CFRoutes } from '@cf/router/appRoutes'
import { _t } from '@cf/utility/Utility.class'
import Alert from '@cfComponents/UIPrimitives/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
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
  const workflowType = workflowDetailResp?.item?.workflowType ?? 'workflow'
  const projectUuid = workflowDetailResp?.item?.projectUuid ?? ''
  const { data: projectTags = [], isLoading: projectTagsLoading } = useQuery({
    ...listProjectTagsOptions({ path: { uuid: projectUuid } }),
    enabled: Boolean(projectUuid)
  })
  const canManageOutcomes = useResourcePermission(
    WorkflowPermission.OUTCOME_MANAGEMENT
  )
  const outcomeGroups = useSelector((state: RootState) =>
    selectOutcomeTagGroups(state, graphUuid, projectTags)
  )
  const navigate = useNavigate()

  const goToEditOutcomes = useCallback(() => {
    navigate(generatePath(CFRoutes.WORKFLOW_OUTCOME_EDIT, { uuid: uuid ?? '' }))
  }, [navigate, uuid])

  if (!graphUuid || !projectUuid || projectTagsLoading) {
    return (
      <Styled.SidebarInnerWrap>
        <Styled.SidebarContent>
          <CircularProgress size={24} />
        </Styled.SidebarContent>
      </Styled.SidebarInnerWrap>
    )
  }

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
              <>{`There are currently no outcomes in this ${workflowType}, navigate to the outcomes view to add outcomes.`}</>
            }
          />
        </Styled.SidebarContent>
        <Styled.SidebarActions>
          <Button
            variant="contained"
            color="primary"
            disabled={!canManageOutcomes}
            onClick={goToEditOutcomes}
          >
            {_t('Add outcomes')}
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
                {group.title && (
                  <Typography component="h6" variant="body2">
                    {group.title}
                  </Typography>
                )}
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
          disabled={!canManageOutcomes}
          onClick={goToEditOutcomes}
        >
          {_t('Edit outcomes')}
        </Button>
      </Styled.SidebarActions>
    </Styled.SidebarInnerWrap>
  )
}

export default OutcomeTab
