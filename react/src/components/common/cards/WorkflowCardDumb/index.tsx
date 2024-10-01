import { _t } from '@cf/utility/utilityFunctions'
import { Fragment, MouseEvent, ReactNode, RefObject } from 'react'

import {
  CardCaption,
  CardChip,
  CardFooter,
  CardFooterActions,
  CardFooterTags,
  CardHeader,
  CardTitle,
  CardWrap
} from './styles'

export enum ChipOptions {
  PROJECT = 'project',
  PROGRAM = 'program',
  COURSE = 'course',
  ACTIVITY = 'activity',
  TEMPLATE = 'template',
  DEFAULT = 'default'
}

export type WorkflowCardChipType = {
  type: ChipOptions
  label: string
}

export type PropsType = {
  id: number
  ref?: RefObject<HTMLDivElement>
  className?: string
  title: string | ReactNode
  description?: string
  isSelected?: boolean
  onClick?: () => void
  onMouseDown?: (evt: MouseEvent<HTMLDivElement>) => void
  chips: (WorkflowCardChipType | ReactNode)[]
  footer?: ReactNode
  isDisabledLink?: boolean
  favourite?: ReactNode
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
  favourite,
  onClick,
  onMouseDown,
  chips,
  footer,
  isDisabledLink
}: PropsType) => (
  <CardWrap onMouseDown={onMouseDown} className={isSelected ? 'selected' : ''}>
    <CardHeader onClick={!isDisabledLink ? onClick : null}>
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
      <CardFooterActions>{favourite}</CardFooterActions>
      {footer}
    </CardFooter>
  </CardWrap>
)

export default WorkflowCardDumb
