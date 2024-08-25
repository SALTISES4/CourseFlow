import { Fragment, MouseEvent, ReactNode, RefObject } from 'react'
import StarIcon from '@mui/icons-material/Star'
import StarOutlineIcon from '@mui/icons-material/StarOutline'

import { WorkflowType } from '@cfModule/types/enum'
import * as Utility from '@cfUtility'
import {
  ESectionObject,
} from '@XMLHTTP/types/entity'

import {
  CardWrap,
  CardHeader,
  CardFooter,
  CardFooterTags,
  CardFooterActions,
  CardTitle,
  CardCaption,
  CardChip,
  CardFavouriteBtn
} from './styles'

export enum CHIP_TYPE {
  PROJECT = 'project',
  PROGRAM = 'program',
  COURSE = 'course',
  ACTIVITY = 'activity',
  TEMPLATE = 'template',
  DEFAULT = 'default'
}

export type WorkflowCardChipType = {
  type: CHIP_TYPE
  label: string
}

export type PropsType = {
  id: number
  ref?: RefObject<HTMLDivElement>
  className?: string
  title: string | ReactNode
  description?: string
  isSelected?: boolean
  isFavourite?: boolean
  onClick?: () => void
  onMouseDown?: (evt: MouseEvent<HTMLDivElement>) => void
  onFavourite?: (evt: MouseEvent<HTMLButtonElement>) => void
  chips: (WorkflowCardChipType | ReactNode)[]
}


const getTypeChip = (workflow): WorkflowCardChipType => {
  const { type, is_strategy } = workflow
  let typeText = window.gettext(type)

  if (type === WorkflowType.LIVE_PROJECT) {
    typeText = window.gettext('classroom')
  }

  if (is_strategy) {
    typeText += ` ${window.gettext('strategy')}`
  }

  const chipType =
    type === WorkflowType.LIVE_PROJECT ? CHIP_TYPE.DEFAULT : type

  return {
    type: chipType as CHIP_TYPE,
    label: Utility.capWords(typeText)
  }
}

const getTemplateChip = (workflow): WorkflowCardChipType => {
  const is_template = workflow.is_template
  if(is_template)return {
    type:CHIP_TYPE.TEMPLATE,
    label: window.gettext("Template")
  }
  return null
}

const getWorkflowCountChip = (workflow): WorkflowCardChipType => {

  if (
    workflow.type === WorkflowType.PROJECT &&
    workflow.workflow_count !== null &&
    workflow.workflow_count > 0
  ) {
    return {
      type: CHIP_TYPE.DEFAULT,
      label: `${workflow.workflow_count} ${window.gettext(
        `workflow` + (workflow.workflow_count > 1 ? 's' : '')
      )}`
    }
  }
  return null
}


export function PrepareBackendDataForWorkflowCardDumb(workflow:ESectionObject):PropsType {
  let type_chip = getTypeChip(workflow)
  let template_chip = getTemplateChip(workflow)
  let count_chip = getWorkflowCountChip(workflow)
  console.log("workflow",{
    ...workflow,
    chips:[type_chip,template_chip,count_chip].filter(entry=>entry!=null)
  })
  return {
    ...workflow,
    chips:[type_chip,template_chip,count_chip].filter(entry=>entry!=null)
  }
}

// Type guard function to check if an item is of type WorkflowCardChipType
function isWorkflowCardChipType(chip: any): chip is WorkflowCardChipType {
  return (
    typeof chip === 'object' &&
    chip !== null &&
    'type' in chip &&
    'label' in chip
  )
}

const WorkflowCardDumb = ({
  title,
  description,
  isSelected,
  isFavourite,
  onFavourite,
  onClick,
  onMouseDown,
  chips
}: PropsType) => (
  <CardWrap
    onClick={onClick}
    onMouseDown={onMouseDown}
    className={isSelected ? 'selected' : ''}
  >
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      {description && <CardCaption>{description}</CardCaption>}
    </CardHeader>
    <CardFooter>
      {chips.length && (
        <CardFooterTags>
          {chips.map((chip, index) => {
            if (!chip) {
              return null
            }

            return isWorkflowCardChipType(chip) ? (
              <CardChip key={index} className={chip.type} label={chip.label} />
            ) : (
              <Fragment key={index}>{chip}</Fragment>
            )
          })}
        </CardFooterTags>
      )}
      <CardFooterActions>
        <CardFavouriteBtn
          aria-label={window.gettext('Favourite')}
          sx={{
            color: isFavourite
              ? 'courseflow.favouriteActive'
              : 'courseflow.favouriteInactive'
          }}
          onClick={onFavourite}
        >
          {isFavourite ? <StarIcon /> : <StarOutlineIcon />}
        </CardFavouriteBtn>
      </CardFooterActions>
    </CardFooter>
  </CardWrap>
)

export default WorkflowCardDumb
