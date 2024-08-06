export type UnitType = {
  value: string
  label: string
  selected?: boolean
}

export enum CREATE_RESOURCE_TYPE {
  BLANK = 'blank',
  TEMPLATE = 'template'
}
