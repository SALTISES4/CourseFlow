import { DataType } from '../Project'

const data: DataType = {
  disciplines: [
    { id: 1, title: 'Biology' },
    { id: 2, title: 'Chemistry' },
    { id: 3, title: 'Test discipline' },
    { id: 4, title: 'Something' },
    { id: 5, title: 'Else' }
  ],
  objectSets: [
    { id: 1, title: 'Outcome' },
    { id: 2, title: 'Project' },
    { id: 3, title: 'Something' },
    { id: 4, title: 'Object set' }
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
