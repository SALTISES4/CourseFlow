import { Fragment, MouseEvent, ReactNode, RefObject } from 'react'

import {
  CardCaption,
  CardChip,
  CardFooter,
  CardFooterActions,
  CardFooterInfo,
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
  chips,
  footer,
  isDisabledLink
}: PropsType) => (
  <CardWrap
    onClick={!isDisabledLink ? onClick : null}
    className={isSelected ? 'selected' : ''}
  >
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      {description && <CardCaption variant="body2">{description}</CardCaption>}
    </CardHeader>
    <CardFooter>
      {!!footer && <CardFooterInfo>{footer}</CardFooterInfo>}
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
    </CardFooter>
  </CardWrap>
)

export default WorkflowCardDumb
