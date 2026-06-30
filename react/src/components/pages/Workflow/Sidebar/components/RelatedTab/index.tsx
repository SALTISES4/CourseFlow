import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { selectOutcomeTagGroups } from '@cf/features/graph/state/selectors/outcomes.selectors'
import { RootState } from '@cf/redux/store'
import { _t } from '@cf/utility/Utility.class'
import Alert from '@cfComponents/UIPrimitives/Alert'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'

import * as Styled from '../../styles'
import Outcome from '../OutcomesTab/Outcome'

const RelatedTab = () => {
  const { uuid } = useParams()
  const { data: workflowDetailResp } = useQuery({
    ...getWorkflowOptions({ path: { uuid: uuid! } }),
    enabled: Boolean(uuid)
  })
  const graphUuid = workflowDetailResp?.item?.graphUuid ?? ''
  const outcomeGroups = useSelector((state: RootState) =>
    selectOutcomeTagGroups(state, graphUuid)
  )
  const alert = true

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
                  'Add Outcomes to be able to attach them to nodes and outcomes within the current workflow.'
                )}
              </>
            }
          />
        </Styled.SidebarContent>
      </Styled.SidebarInnerWrap>
    )
  }

  return (
    <Styled.SidebarInnerWrap>
      <Styled.SidebarContent>
        <Styled.SidebarTitle as="h3" variant="h6">
          {_t('Outcomes from parent workflows')}
        </Styled.SidebarTitle>
        <Typography variant="body2" sx={{ mb: 3 }}>
          {_t(
            'Drag and drop to associate outcomes from parents workflows to outcomes of your current workflow. Click on an outcome to highlight relevant nodes.'
          )}
        </Typography>
        {alert && (
          <Alert
            severity="warning"
            persistent
            subtitle="You have linked this workflow to multiple nodes. You may see outcomes from different parent workflows, or duplicates of outcomes."
          />
        )}
        {outcomeGroups.map(
          (group) =>
            !!group.outcomes.length && (
              <Styled.GroupWrap key={group.uuid}>
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
    </Styled.SidebarInnerWrap>
  )
}

export default RelatedTab
