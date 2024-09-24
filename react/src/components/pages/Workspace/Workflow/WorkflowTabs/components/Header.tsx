import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { OuterContentWrap } from '@cf/mui/helper'
import { LibraryObjectType } from '@cf/types/enum'
import { _t, convertEnum } from '@cf/utility/utilityFunctions'
import { CHIP_TYPE } from '@cfComponents/cards/WorkflowCardDumb'
import { CardChip } from '@cfComponents/cards/WorkflowCardDumb/styles'
import Favourite from '@cfComponents/UIPrimitives/Favourite'
import { workflowTitle } from '@cfComponents/UIPrimitives/Titles.ts'
import { AppState } from '@cfRedux/types/type'
import { Box } from '@mui/material'
import Typography from '@mui/material/Typography'
import * as React from 'react'
import { useContext } from 'react'
import { useSelector } from 'react-redux'

// @todo not sure this needs its own file
const Header = () => {
  const context = useContext(WorkFlowConfigContext)
  const workflow = useSelector((state: AppState) => state.workflow)

  const typeText = `${_t(workflow.type)} ${
    workflow.isStrategy ? _t('strategy') : ''
  }`

  return (
    <OuterContentWrap sx={{ pb: 0 }}>
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
          {workflowTitle({
            title: workflow.title,
            code: workflow.code,
            deleted: workflow.deleted
          })}
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
    </OuterContentWrap>
  )
}

export default Header
