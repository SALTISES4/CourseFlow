export const timeUnits = [
  '',
  'Second',
  'Minutes',
  'Hours',
  'Days',
  'Sections',
  'Months',
  'Years',
  'Credits'
]

export enum CreateResourceOptions {
  BLANK = 'blank',
  TEMPLATE = 'template'
}

export type WorkflowTemplateSelection = {
  uuid: string
  title: string
  item: LibraryItemOut
}
import { LibraryItemOut } from '@cf/api/gen'
