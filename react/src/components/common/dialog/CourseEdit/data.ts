import { CourseFormDataType } from '@cfCommonComponents/dialog/CreateWizard/components/FormCourse/types'

const data: CourseFormDataType = {
  title: 'Course title goes here',
  description: 'Some course description lorem ipsum text super long text',
  courseNumber: 'BIO101',
  duration: '2',
  units: [
    {
      value: 'hours',
      label: 'Hours',
      selected: true
    },
    {
      value: 'days',
      label: 'Days'
    },
    {
      value: 'weeks',
      label: 'Weeks'
    }
  ],
  ponderation: {
    theory: '3',
    practice: '3',
    individual: '3',
    generalEdu: '3',
    specificEdu: '3'
  }
}

export default data
