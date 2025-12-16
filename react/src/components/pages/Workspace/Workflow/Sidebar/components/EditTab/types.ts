import { CfObjectType } from '@cf/types/enum'

export enum EditableType {
  TERM = 'editable_term',
  WEEK = CfObjectType.WEEK,
  PART = 'editable_part',
  OUTCOME = CfObjectType.OUTCOME,
  NODE = CfObjectType.NODE,
  NODE_LINK = CfObjectType.NODELINK,
  COLUMN = CfObjectType.COLUMN
}
