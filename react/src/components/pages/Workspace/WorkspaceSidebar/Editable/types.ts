import { NodeForm } from '../components/EditTab/components/EditNode/types'
import { NodeCategoryForm } from '../components/EditTab/components/EditNodeCategory/types'
import { NodeLinkForm } from '../components/EditTab/components/EditNodeLink/types'
import { OutcomeForm } from '../components/EditTab/components/EditOutcome/types'
import { PartForm } from '../components/EditTab/components/EditPart/types'
import { TermForm } from '../components/EditTab/components/EditTerm/types'
import { WeekForm } from '../components/EditTab/components/EditWeek/types'

export type EditablePropsType = {
  type: EditableType | null
  data: EditableDataType<EditableType> | null
}

export enum EditableType {
  TERM = 'editable_term',
  WEEK = 'editable_week',
  PART = 'editable_part',
  OUTCOME = 'editable_outcome',
  NODE = 'editable_node',
  NODE_LINK = 'editable_node_link',
  NODE_CATEGORY = 'editable_node_category'
}

// map out each type to a corresponding form type
type EditableDataMap = {
  [EditableType.TERM]: TermForm
  [EditableType.WEEK]: WeekForm
  [EditableType.PART]: PartForm
  [EditableType.OUTCOME]: OutcomeForm
  [EditableType.NODE]: NodeForm
  [EditableType.NODE_LINK]: NodeLinkForm
  [EditableType.NODE_CATEGORY]: NodeCategoryForm
}

// finally, have an utility type to properly use the correct data based on type
export type EditableDataType<T extends EditableType> =
  T extends keyof EditableDataMap ? EditableDataMap[T] : never
