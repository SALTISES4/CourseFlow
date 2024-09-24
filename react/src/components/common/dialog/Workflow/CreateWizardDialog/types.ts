export const timeUnits = [
  '',
  'Second',
  'Minutes',
  'Hours',
  'Days',
  'Weeks',
  'Months',
  'Years',
  'Credits'
]

export type UnitType = {
  value: string
  label: string
  selected?: boolean
}

export enum CREATE_RESOURCE_TYPE {
  BLANK = 'blank',
  TEMPLATE = 'template'
}

export type WorkflowFormType = {
  title: string
  description: string
  duration: string
  courseNumber: string
  units: string
  ponderation?: {
    theory: string
    practice: string
    individual: string
    generalEdu: string
    specificEdu: string
  }
}
