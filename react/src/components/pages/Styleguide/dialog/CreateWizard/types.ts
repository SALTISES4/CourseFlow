export type UnitType = {
  value: string
  label: string
  selected?: boolean
}

export enum CreateResourceOptions {
  BLANK = 'blank',
  TEMPLATE = 'template'
}
