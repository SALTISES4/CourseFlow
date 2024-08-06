import { CHIP_TYPE } from '@cfCommonComponents/workflow/WorkflowCards/WorkflowCardDumb'

export type ProjectType = {
  id: number
  title: string
  caption: string
  isSelected: boolean
  isFavourite: boolean
  chips: {
    type: CHIP_TYPE
    label: string
  }[]
}
