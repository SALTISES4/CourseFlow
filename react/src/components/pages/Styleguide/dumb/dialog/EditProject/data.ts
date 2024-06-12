import { DataType } from '../Project'
import { OBJECT_SET_TYPE } from '@cfCommonComponents/dialog/CreateProject/type'

const data: DataType = {
  disciplines: [
    { id: 1, title: 'Biology' },
    { id: 2, title: 'Chemistry' },
    { id: 3, title: 'Test discipline' },
    { id: 4, title: 'Something' },
    { id: 5, title: 'Else' }
  ],
  objectSets: [
    { type: OBJECT_SET_TYPE.PROGRAM_OUTCOME, label: 'Outcome' },
    { type: OBJECT_SET_TYPE.ACTIVITY_OUTCOME, label: 'Project' },
    { type: OBJECT_SET_TYPE.PROGRAM_NODE, label: 'Something' },
    { type: OBJECT_SET_TYPE.COURSE_OUTCOME, label: 'Object set' }
  ],
  formFields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      value: 'Project title goes here',
      required: true
    },
    {
      name: 'description',
      label: 'Description',
      type: 'text',
      value:
        'harder bring section memory put most steam habit structure ill lion bone driving yard equipment popular poor progress cell any full height lamp stay'
    }
  ]
}

export default data
