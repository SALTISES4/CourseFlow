import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { selectOutcomeTagGroups } from '@cf/features/graph/state/selectors/outcomes.selectors'
import { RootState } from '@cf/redux/store'
import Alert from '@cfComponents/UIPrimitives/Alert'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import * as Styled from '../../styles'
import Outcome from '../OutcomesTab/Outcome'

const RelatedTab = () => {
  const { t } = useTranslation('workflow')
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
            {t('outcomes.title')}
          </Styled.SidebarTitle>
          <Alert
            severity="info"
            persistent
            subtitle={
              <>
                {t('outcomes.addRequired')}
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
          {t('outcomes.fromParents')}
        </Styled.SidebarTitle>
        <Typography variant="body2" sx={{ mb: 3 }}>
          {t('outcomes.sidebarHelp')}
        </Typography>
        {alert && (
          <Alert
            severity="warning"
            persistent
            subtitle={t('related.multipleLinksWarning')}
          />
        )}
        {outcomeGroups.map(
          (group) =>
            !!group.outcomes.length && (
              <Styled.GroupWrap key={group.uuid}>
                <Typography component="h6" variant="body2">
                  {group.uuid === -1 && outcomeGroups.length > 1
                    ? t('outcomes.untagged')
                    : group.title}
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
