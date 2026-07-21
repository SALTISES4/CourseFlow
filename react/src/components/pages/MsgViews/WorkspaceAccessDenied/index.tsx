import { OuterContentWrap } from '@cfMUI/helper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

type WorkspaceAccessDeniedProps = {
  workspace: 'project' | 'workflow'
  archived?: boolean
}

const WorkspaceAccessDenied = ({
  workspace,
  archived = false
}: WorkspaceAccessDeniedProps) => {
  const title = archived
    ? `the ${workspace} is archived`
    : `no ${workspace} access`
  const subtitle = archived
    ? `the ${workspace} must be restored by the owner to enable viewing and editing.`
    : `this ${workspace} is private. you need permission from the owner to view or edit its contents.`

  return (
    <OuterContentWrap
      data-test-id={`${workspace}-access-denied-view`}
      sx={{ pt: 8 }}
    >
      <Stack spacing={2}>
        <Typography component="h1" variant="h4">
          {title}
        </Typography>
        <Typography>{subtitle}</Typography>
      </Stack>
    </OuterContentWrap>
  )
}

export default WorkspaceAccessDenied
