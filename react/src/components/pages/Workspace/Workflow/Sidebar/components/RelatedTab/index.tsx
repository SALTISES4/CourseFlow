import { selectOutcomeGroups } from '@cf/redux/selectors/outcomes.selector'
import Alert from '@cfComponents/UIPrimitives/Alert'
import Typography from '@mui/material/Typography'
import { useSelector } from 'react-redux'

import data from './data'
import * as Styled from '../../styles'
import { OutcomeGroup } from '../OutcomesTab/Outcome'

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

export default RelatedTab
