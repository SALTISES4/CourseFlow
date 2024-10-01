import { ChipMode } from '@cfPages/Styleguide/components/WorkflowCard/types'

export type ProjectType = {
  id: number
  title: string
  caption: string
  isSelected: boolean
  isFavourite: boolean
  chips: {
    type: ChipMode
    label: string
  }[]
}
