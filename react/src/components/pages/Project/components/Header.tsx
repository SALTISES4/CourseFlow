import { ChipOptions } from '@cf/components/common/cards/WorkflowCardDumb'
import { CardChip } from '@cf/components/common/cards/WorkflowCardDumb/styles'
import Favourite from '@cf/components/common/UIPrimitives/Favourite'
import { OuterContentWrap } from '@cf/styles/mui/helper'
import { ProjectDetailsType } from '@cf/types/common'
import { LibraryObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/Utility.class'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

const ProjectHeader = ({ project }: { project: ProjectDetailsType }) => (
  <OuterContentWrap sx={{ pb: 0 }}>
    <Stack
      direction="row"
      spacing={3}
      justifyContent="space-between"
      sx={{ mt: 6, mb: 3 }}
      // @todo selection manager is only defined in workflow currently so we'll need to go get that
    >
      <Typography
        style={{
          display: 'flex',
          alignItems: 'center'
        }}
        component="h1"
        variant="h4"
      >
        {project.title}
        {project.isDeleted && (
          <CardChip
            style={{ display: 'flex', alignItems: 'center' }}
            className={ChipOptions.ACTIVITY as string}
            label={_t('Archived')}
          />
        )}
      </Typography>

      <Box>
        <Favourite
          uuid={project.uuid}
          isFavourite={project.isFavourite}
          type={LibraryObjectType.PROJECT}
        />
      </Box>
    </Stack>
  </OuterContentWrap>
)

export default ProjectHeader
