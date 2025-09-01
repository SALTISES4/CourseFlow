import {
  selectOutcomeChildrenById,
  selectOutcomeGroups
} from '@cf/redux/selectors/outcomes.selector'
import { AppState } from '@cf/redux/types/type'
import Alert from '@cfComponents/UIPrimitives/Alert'
import * as StyledOutcomes from '@cfViews/WorkflowView/componentViews/OutcomeEditViewV2/components/OutcomeTree/styles'
import Typography from '@mui/material/Typography'
import { useSelector } from 'react-redux'

import data from './data'
import Outcome from './Outcome'
import * as Styled from '../../styles'

const RelatedTab = () => {
  const outcomeGroups = useSelector(selectOutcomeGroups)
  const { title, subtitle, alert } = data

  return (
    <Styled.SidebarInnerWrap>
      <Styled.SidebarContent>
        <Styled.SidebarTitle as="h3" variant="h6">
          {title}
        </Styled.SidebarTitle>
        {subtitle && (
          <Typography variant="body2" sx={{ mb: 3 }}>
            {subtitle}
          </Typography>
        )}
        {alert && (
          <Alert
            severity="warning"
            persistent
            subtitle="You have linked this workflow to multiple nodes. You may see outcomes from different parent workflows, or duplicates of outcomes."
          />
        )}
        {outcomeGroups.map(
          (group, idx) =>
            !!group.children?.length && (
              <Styled.GroupWrap key={idx}>
                <Typography component="h6" variant="body2">
                  {group.title}
                </Typography>
                <OutcomeGroup prefix={[]} parentId={group.id} />
              </Styled.GroupWrap>
            )
        )}
      </Styled.SidebarContent>
    </Styled.SidebarInnerWrap>
  )
}

export const OutcomeGroup = ({
  parentId,
  prefix
}: {
  parentId: number
  prefix: (number | string)[]
}) => {
  const childOutcomes = useSelector((state: AppState) =>
    selectOutcomeChildrenById(state, parentId)
  )

  if (!childOutcomes.length) {
    return null
  }

  return (
    <StyledOutcomes.OutcomeGroup>
      {childOutcomes.map((outcome, index) => (
        <StyledOutcomes.OutcomeGroupItem key={outcome.id}>
          <Outcome {...outcome} prefix={[...prefix, index + 1]} />
        </StyledOutcomes.OutcomeGroupItem>
      ))}
    </StyledOutcomes.OutcomeGroup>
  )
}

export default RelatedTab
