import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { _t } from '@cf/utility/Utility.class'
import { ChipOptions } from '@cfComponents/cards/WorkflowCardDumb'
import { CardChip } from '@cfComponents/cards/WorkflowCardDumb/styles'
import Favourite from '@cfComponents/UIPrimitives/Favourite'
import { workflowTitle } from '@cfComponents/UIPrimitives/Titles'
import { OuterContentWrap } from '@cfMUI/helper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

// @todo not sure this needs its own file
const Header = () => {
  // TODO: add editable name functinality
  // const context = useContext(WorkflowConfigContext)
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
          // TODO: add editable name functinality
        >
          {workflowTitle({
            title: workflow?.title ?? '',
            code: '',
            deleted: false
          })}
        </Typography>

        <Favourite id={workflowUuid} isFavorite={false} />
      </Stack>
    </OuterContentWrap>
  )
}

export default Header
