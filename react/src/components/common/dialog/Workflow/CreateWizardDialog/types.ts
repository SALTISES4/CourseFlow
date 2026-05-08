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

export type UnitType = {
  value: string
  label: string
  selected?: boolean
}

export enum CreateResourceOptions {
  BLANK = 'blank',
  TEMPLATE = 'template'
}

export type WorkflowFormType = {
  title: string
  description: string
  duration: number
  courseNumber: string
  units: number
  ponderation?: {
    theory: number
    practice: number
    individual: number
    generalEdu: number
    specificEdu: number
  }
}
