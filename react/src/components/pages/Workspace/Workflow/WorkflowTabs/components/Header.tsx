import { workflowTitle } from '@cf/components/common/UIPrimitives/Titles'
import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { LibraryObjectType, WorkflowType } from '@cf/types/enum'
import { _t, convertEnum } from '@cf/utility/utilityFunctions'
import { CHIP_TYPE } from '@cfComponents/cards/WorkflowCardDumb'
import { CardChip } from '@cfComponents/cards/WorkflowCardDumb/styles'
import Favourite from '@cfComponents/UIPrimitives/Favourite'
import { AppState } from '@cfRedux/types/type'
import { Box } from '@mui/material'
import Typography from '@mui/material/Typography'
import * as React from 'react'
import { useContext } from 'react'
import { useSelector } from 'react-redux'

// @todo not sure this needs its own file
const Header = ({
  isStrategy,
  workflowType,
  title,
  code,
  deleted
}: {
  isStrategy: boolean
  workflowType: WorkflowType
  title: string
  code: any
  deleted: boolean
}) => {
  const context = useContext(WorkFlowConfigContext)
  const workflow = useSelector((state: AppState) => state.workflow)

  const typeText = `${_t(workflowType)} ${isStrategy ? _t('strategy') : ''}`

  return (
    <Box
      sx={{
        display: 'flex',

        justifyContent: 'space-between'
      }}
      onClick={(evt) => context.selectionManager.changeSelection(evt)}
    >
      <Typography
        sx={{
          display: 'flex',
          alignItems: 'center'
        }}
        component="h1"
        variant="h4"
      >
        {workflowTitle(title, code, deleted)}
        <CardChip
          sx={{ display: 'flex', alignItems: 'center' }}
          className={CHIP_TYPE.ACTIVITY as string}
          label={typeText}
        />
      </Typography>

      <Favourite
        id={workflow.id}
        isFavorite={workflow.favourite}
        type={convertEnum<LibraryObjectType>(
          workflow.type,
          LibraryObjectType,
          LibraryObjectType.ACTIVITY
        )}
      />
    </Box>
  )
}

export default Header
