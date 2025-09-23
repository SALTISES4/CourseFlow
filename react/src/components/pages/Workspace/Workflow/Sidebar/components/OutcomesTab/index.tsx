import { selectOutcomeGroups } from '@cf/redux/selectors/outcomes.selector'
import Alert from '@cfComponents/UIPrimitives/Alert'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useSelector } from 'react-redux'

import data from './data'
import { OutcomeGroup } from './Outcome'
import * as Styled from '../../styles'

const OutcomeTab = () => {
  const outcomeGroups = useSelector(selectOutcomeGroups)
  const { title, subtitle } = data

  if (!outcomeGroups.length) {
    return (
      <Styled.SidebarInnerWrap>
        <Styled.SidebarContent>
          {title && (
            <Styled.SidebarTitle as="h3" variant="h6">
              {title}
            </Styled.SidebarTitle>
          )}
          <Alert
            severity="info"
            persistent
            subtitle="No outcomes have been added yet."
          />
        </Styled.SidebarContent>
      </Styled.SidebarInnerWrap>
    )
  }

  return (
    <Styled.SidebarInnerWrap>
      <Styled.SidebarContent>
        {title && (
          <Styled.SidebarTitle as="h3" variant="h6">
            {title}
          </Styled.SidebarTitle>
        )}
        {subtitle && (
          <Typography variant="body2" sx={{ mb: 3 }}>
            {subtitle}
          </Typography>
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
      <Styled.SidebarActions>
        <Button variant="contained" color="secondary">
          Edit outcomes
        </Button>
      </Styled.SidebarActions>
    </Styled.SidebarInnerWrap>
  )
}

export default OutcomeTab
