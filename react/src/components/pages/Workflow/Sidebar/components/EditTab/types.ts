import { CfObjectType } from '@cf/types/enum'

export enum EditableType {
  SECTION = CfObjectType.SECTION,
  OUTCOME = CfObjectType.OUTCOME,
  NODE = CfObjectType.NODE,
  NODE_LINK = CfObjectType.EDGE,
  COLUMN = CfObjectType.COLUMN
}
