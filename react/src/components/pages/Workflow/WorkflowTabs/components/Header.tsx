import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import Favorite from '@cf/components/common/UIPrimitives/Favorite'
import { _t } from '@cf/utility/Utility.class'
import { workflowTitle } from '@cfComponents/UIPrimitives/Titles'
import { OuterContentWrap } from '@cfMUI/helper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

const Header = () => {
  const { uuid } = useParams()
  const workflowUuid = uuid ?? ''
  const { data: workflowResp } = useQuery({
    ...getWorkflowOptions({ path: { uuid: workflowUuid } }),
    enabled: Boolean(workflowUuid)
  })

  const workflow = workflowResp?.item

  return (
    <OuterContentWrap sx={{ pb: 0 }}>
      <Stack
        direction="row"
        spacing={3}
        justifyContent="space-between"
        sx={{ mt: 6, mb: 3 }}
      >
        <Typography
          component="h1"
          variant="h4"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          {workflowTitle({
            title: workflow?.title ?? '',
            code: '',
            deleted: false
          })}
        </Typography>

        <Favorite
          id={workflowUuid}
          isFavorite={workflow?.isFavorite ?? false}
        />
      </Stack>
    </OuterContentWrap>
  )
}

export default Header
