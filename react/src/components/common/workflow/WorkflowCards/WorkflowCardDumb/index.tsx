import { Fragment, MouseEvent, ReactNode, RefObject } from 'react'
import StarIcon from '@mui/icons-material/Star'
import StarOutlineIcon from '@mui/icons-material/StarOutline'

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

export type WorklowCardChipType = {
  type: CHIP_TYPE
  label: string
}

export type PropsType = {
  ref?: RefObject<HTMLDivElement>
  className?: string
  title: string | ReactNode
  caption?: string
  isSelected?: boolean
  isFavourite?: boolean
  onClick?: () => void
  onMouseDown?: (evt: MouseEvent<HTMLDivElement>) => void
  onFavourite?: (evt: MouseEvent<HTMLButtonElement>) => void
  chips: (WorklowCardChipType | ReactNode)[]
}

// Type guard function to check if an item is of type WorklowCardChipType
function isWorkflowCardChipType(chip: any): chip is WorklowCardChipType {
  return (
    typeof chip === 'object' &&
    chip !== null &&
    'type' in chip &&
    'label' in chip
  )
}

const WorkflowCardDumb = ({
  title,
  caption,
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
      {caption && <CardCaption>{caption}</CardCaption>}
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
