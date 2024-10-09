import { OuterContentWrap } from '@cf/mui/helper'
import { ProjectDetailsType } from '@cf/types/common'
import { LibraryObjectType } from '@cf/types/enum'
import { _t } from '@cf/utility/utilityFunctions'
import { ChipOptions } from '@cfComponents/cards/WorkflowCardDumb'
import { CardChip } from '@cfComponents/cards/WorkflowCardDumb/styles'
import Favourite from '@cfComponents/UIPrimitives/Favourite'
import { Box } from '@mui/material'
import Typography from '@mui/material/Typography'
import * as React from 'react'

// @todo not sure this needs its own file
const Header = ({ project }: { project: ProjectDetailsType }) => {
  return (
    <OuterContentWrap sx={{ pb: 0 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between'
        }}
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
              label={'Archived'}
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
      </Box>
    </OuterContentWrap>
  )
}

export default Header
