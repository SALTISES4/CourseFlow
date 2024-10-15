// import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { OuterContentWrap } from '@cf/mui/helper'
import { LibraryObjectType } from '@cf/types/enum'
import { _t, convertEnum } from '@cf/utility/utilityFunctions'
import { ChipOptions } from '@cfComponents/cards/WorkflowCardDumb'
import { CardChip } from '@cfComponents/cards/WorkflowCardDumb/styles'
import Favourite from '@cfComponents/UIPrimitives/Favourite'
import { workflowTitle } from '@cfComponents/UIPrimitives/Titles.ts'
import { AppState } from '@cfRedux/types/type'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// import { useContext } from 'react'
import { useSelector } from 'react-redux'

// @todo not sure this needs its own file
const Header = () => {
  // TODO: add editable name functinality
  // const context = useContext(WorkFlowConfigContext)
  const workflow = useSelector((state: AppState) => state.workflow)

  const typeText = `${_t(workflow.type)} ${
    workflow.isStrategy ? _t('strategy') : ''
  }`

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
          // onClick={(evt) => context.selectionManager.changeSelection(evt)}
        >
          {workflowTitle({
            title: workflow.title,
            code: workflow.code,
            deleted: workflow.deleted
          })}

          <CardChip
            // TODO: use dynamic classname
            className={ChipOptions.ACTIVITY as string}
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
      </Stack>
    </OuterContentWrap>
  )
}

export default Header
