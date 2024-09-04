import * as React from 'react'
import { useContext } from 'react'
import { WorkFlowConfigContext } from '@cf/context/workFlowConfigContext'
import { _t } from '@cf/utility/utilityFunctions'
import { WorkflowType } from '@cf/types/enum'
import Typography from '@mui/material/Typography'
import { workflowTitle } from '@cf/components/common/UIPrimitives/Titles'
import { CHIP_TYPE } from '@cfComponents/cards/WorkflowCardDumb'
import { CardChip } from '@cfComponents/cards/WorkflowCardDumb/styles'

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

  const typeText = `${_t(workflowType)} ${isStrategy && _t('strategy')}`

  return (
    <div onClick={(evt) => context.selectionManager.changeSelection(evt)}>
      <Typography component="h1" variant="h4">
        {workflowTitle(title, code, deleted)}
      </Typography>
      <CardChip className={CHIP_TYPE.ACTIVITY as string} label={typeText} />
    </div>
  )
}

export default Header
