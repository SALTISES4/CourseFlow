import { CfObjectType } from '@cf/types/enum'

export enum EditableType {
  TERM = 'editable_term',
  SECTION = CfObjectType.SECTION,
  PART = 'editable_part',
  OUTCOME = CfObjectType.OUTCOME,
  NODE = CfObjectType.NODE,
  NODE_LINK = CfObjectType.EDGE,
  COLUMN = CfObjectType.COLUMN
}
