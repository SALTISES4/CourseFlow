import { ProjectDetailOut } from '@cf/api/gen'
import Favorite from '@cf/components/common/UIPrimitives/Favorite'
import { ChipOptions } from '@cfComponents/cards/WorkflowCardDumb'
import { CardChip } from '@cfComponents/cards/WorkflowCardDumb/styles'
import { OuterContentWrap } from '@cfMUI/helper'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

const ProjectHeader = ({ project }: { project: ProjectDetailOut }) => {
  const { t } = useTranslation('project')

  return (
    <OuterContentWrap sx={{ pb: 0 }}>
    <Stack
      direction="row"
      spacing={3}
      justifyContent="space-between"
      sx={{ mt: 6, mb: 3 }}
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
        {project.isArchived && (
          <CardChip
            style={{ display: 'flex', alignItems: 'center' }}
            className={ChipOptions.ACTIVITY as string}
            label={t('status.archived')}
          />
        )}
      </Typography>

      <Box>
        <Favorite uuid={project.uuid} isFavorite={project.isFavorite} />
      </Box>
    </Stack>
    </OuterContentWrap>
  )
}

export default ProjectHeader
