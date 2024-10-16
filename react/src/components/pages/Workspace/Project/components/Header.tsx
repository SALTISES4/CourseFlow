import { OuterContentWrap } from '@cf/mui/helper'
import { ProjectDetailsType } from '@cf/types/common'
import { LibraryObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import { ChipOptions } from '@cfComponents/cards/WorkflowCardDumb'
import { CardChip } from '@cfComponents/cards/WorkflowCardDumb/styles'
import Favourite from '@cfComponents/UIPrimitives/Favourite'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

// @todo not sure this needs its own file
const Header = ({ project }: { project: ProjectDetailsType }) => (
  <OuterContentWrap sx={{ pb: 0 }}>
    <Stack
      direction="row"
      spacing={3}
      justifyContent="space-between"
      sx={{ mt: 6, mb: 3 }}
      // @todo selection manager is only defined in workflow currently so we'll need to go get that
      // onClick={(evt) => context.selectionManager.changeSelection(evt)}
    >
      <Typography
        sx={{
          display: 'flex',
          alignItems: 'center'
        }}
        component="h1"
        variant="h4"
      >
        {project.title}
        {project.isDeleted && (
          <CardChip
            sx={{ display: 'flex', alignItems: 'center' }}
            className={ChipOptions.ACTIVITY as string}
            label={_t('Archived')}
          />
        )}
      </Typography>

      <Box>
        <Favourite
          id={project.id}
          isFavorite={project.isFavorite}
          type={LibraryObjectType.PROJECT}
        />
      </Box>
    </Stack>
  </OuterContentWrap>
)

export default Header
