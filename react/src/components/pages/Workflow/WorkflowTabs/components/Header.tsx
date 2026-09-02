import Favorite from '@cf/components/common/UIPrimitives/Favorite'
import { workflowTitle } from '@cfComponents/UIPrimitives/Titles'
import { OuterContentWrap } from '@cfMUI/helper'
import type { WorkflowPageData } from '@cfPages/Workflow/types'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

const Header = ({
  workflow,
  publicView
}: {
  workflow: WorkflowPageData
  publicView: boolean
}) => {
  const { t } = useTranslation('common')
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
            title: workflow.title,
            code: '',
            deleted: false,
            fallbackText: t('labels.untitled'),
            deletedText: t('labels.deletedSuffix')
          })}
        </Typography>

        {!publicView && 'isFavorite' in workflow && (
          <Favorite id={workflow.uuid} isFavorite={workflow.isFavorite} />
        )}
      </Stack>
    </OuterContentWrap>
  )
}

export default Header
