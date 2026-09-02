import {
  getWorkflowOptions,
  listProjectTagsOptions
} from '@cf/api/gen/@tanstack/react-query.gen'
import { WorkflowPermission } from '@cf/api/gen/types.gen'
import { useResourcePermission } from '@cf/context/workspacePermissionsContext'
import { selectOutcomeTagGroups } from '@cf/features/graph/state/selectors/outcomes.selectors'
import { RootState } from '@cf/redux/store'
import { CFRoutes } from '@cf/router/appRoutes'
import Alert from '@cfComponents/UIPrimitives/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import Outcome from './Outcome'
import * as Styled from '../../styles'

const OutcomeTab = () => {
  const { t } = useTranslation('workflow')
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
            {t('outcomes.title')}
          </Styled.SidebarTitle>
          <Alert
            severity="info"
            persistent
            subtitle={
              <>{t('outcomes.empty', { workflowType })}</>
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
            {t('outcomes.addPlural')}
          </Button>
        </Styled.SidebarActions>
      </Styled.SidebarInnerWrap>
    )
  }

  return (
    <Styled.SidebarInnerWrap>
      <Styled.SidebarContent>
        <Styled.SidebarTitle as="h3" variant="h6">
          {t('outcomes.title')}
        </Styled.SidebarTitle>
        <Typography variant="body2" sx={{ mb: 3 }}>
          {t('outcomes.sidebarHelp')}
        </Typography>
        {outcomeGroups.map(
          (group, idx) =>
            !!group.outcomes.length && (
              <Styled.GroupWrap key={idx}>
                {group.title && (
                  <Typography component="h6" variant="body2">
                    {group.uuid === -1 && outcomeGroups.length > 1
                      ? t('outcomes.untagged')
                      : group.title}
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
          {t('outcomes.edit')}
        </Button>
      </Styled.SidebarActions>
    </Styled.SidebarInnerWrap>
  )
}

export default OutcomeTab
