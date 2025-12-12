import { TNodelink } from '@cf/redux/types/type'
import { CfObjectType } from '@cf/types/enum'

import { NodeForm } from './components/EditNode/types'
import { NodeCategoryForm } from './components/EditNodeCategory/types'
import { OutcomeForm } from './components/EditOutcome/types'
import { PartForm } from './components/EditPart/types'
import { TermForm } from './components/EditTerm/types'
import { WeekForm } from './components/EditWeek/types'

export enum EditableType {
  TERM = 'editable_term',
  WEEK = CfObjectType.WEEK,
  PART = 'editable_part',
  OUTCOME = CfObjectType.OUTCOME,
  NODE = CfObjectType.NODE,
  NODE_LINK = CfObjectType.NODELINK,
  NODE_CATEGORY = CfObjectType.COLUMN
}

// map out each type to a corresponding form type
type EditableDataMap = {
  [EditableType.TERM]: TermForm
  [EditableType.WEEK]: WeekForm
  [EditableType.PART]: PartForm
  [EditableType.OUTCOME]: OutcomeForm
  [EditableType.NODE]: NodeForm
  [EditableType.NODE_LINK]: Pick<TNodelink, 'title' | 'dashed' | 'textPosition'>
  [EditableType.NODE_CATEGORY]: NodeCategoryForm
}

// finally, have an utility type to properly use the correct data based on type
export type EditableDataType<T extends EditableType> =
  T extends keyof EditableDataMap ? EditableDataMap[T] : never
