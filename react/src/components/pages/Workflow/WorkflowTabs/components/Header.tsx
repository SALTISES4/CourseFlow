import { getWorkflowOptions } from '@cf/api/gen/@tanstack/react-query.gen'
import { LibraryObjectType } from '@cf/types/enum'
import Utility, { _t } from '@cf/utility/Utility.class'
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

  const typeText = _t(workflow?.workflowType ?? 'workflow')

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
            code: null,
            deleted: false
          })}

          <CardChip
            // TODO: use dynamic classname
            className={ChipOptions.ACTIVITY as string}
            label={typeText}
          />
        </Typography>

        <Favourite
          id={workflowUuid}
          isFavorite={false}
          type={Utility.convertEnum<LibraryObjectType>(
            workflow?.workflowType ?? '',
            LibraryObjectType,
            LibraryObjectType.ACTIVITY
          )}
        />
      </Stack>
    </OuterContentWrap>
  )
}

export default Header
