import { UnitType } from '../../types'

export type CourseFormDataType = {
  title: string
  description: string
  courseNumber: string
  duration: string
  units: UnitType[]
  ponderation: {
    theory: string
    practice: string
    individual: string
    generalEdu: string
    specificEdu: string
  }
}
