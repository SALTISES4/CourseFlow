import Alert from '@cfComponents/UIPrimitives/Alert'
import Typography from '@mui/material/Typography'

import {
  GroupWrap,
  SidebarContent,
  SidebarInnerWrap,
  SidebarTitle
} from '../../styles'
import { OutcomeGroupWrap } from '../OutcomesTab'
import data from './data'

const RelatedTab = () => {
  const { title, subtitle, alert, groups } = data
  return (
    <SidebarInnerWrap>
      <SidebarContent>
        <SidebarTitle as="h3" variant="h6">
          {title}
        </SidebarTitle>
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
        {groups?.map((group, idx) => (
          <GroupWrap key={idx}>
            <Typography component="h6" variant="body2">
              {group.title}
            </Typography>
            <OutcomeGroupWrap group={group} blocks={group.blocks} />
          </GroupWrap>
        ))}
      </SidebarContent>
    </SidebarInnerWrap>
  )
}

export default RelatedTab
