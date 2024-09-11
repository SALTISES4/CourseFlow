import Typography from '@mui/material/Typography'

import { GroupWrap } from '../../styles'
import { SidebarDataType } from '../../types'

const OutcomeTab = ({
  title,
  subtitle,
  groups
}: SidebarDataType['outcomes']) => {
  return (
    <>
      <Typography component="h3" variant="h6" sx={{ mb: 3, fontWeight: '600' }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" sx={{ mb: 3 }}>
          {subtitle}
        </Typography>
      )}
      {groups?.map((group, idx) => (
        <GroupWrap key={idx}>
          <Typography component="h6" variant="body2">
            {group.title}
          </Typography>
        </GroupWrap>
      ))}
    </>
  )
}

export default OutcomeTab
