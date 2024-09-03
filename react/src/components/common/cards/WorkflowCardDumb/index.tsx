import { Fragment, MouseEvent, ReactNode, RefObject } from 'react'
import StarIcon from '@mui/icons-material/Star'
import StarOutlineIcon from '@mui/icons-material/StarOutline'
import { _t } from '@cf/utility/utilityFunctions'

import { WorkflowType } from '@cf/types/enum'
import * as Utility from '@cfUtility'
import { ELibraryObject } from '@XMLHTTP/types/entity'

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
  footer?: ReactNode
  isDisabledLink?: boolean
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
  chips,
  footer,
  isDisabledLink
}: PropsType) => (
  <CardWrap
    onClick={!isDisabledLink ? onClick : null}
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
          aria-label={_t('Favourite')}
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
      {footer}
    </CardFooter>
  </CardWrap>
)

export default WorkflowCardDumb
