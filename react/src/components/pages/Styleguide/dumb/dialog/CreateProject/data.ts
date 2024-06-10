import { PropsType } from './'

const data: PropsType = {
  disciplines: [
    { id: 1, title: 'Biology' },
    { id: 2, title: 'Chemistry' },
    { id: 3, title: 'Test discipline' },
    { id: 4, title: 'Something' },
    { id: 5, title: 'Else' }
  ],
  showNoProjectsAlert: true,
  objectSets: [],
  formFields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      value: '',
      required: true
    },
    {
      name: 'description',
      label: 'Description',
      type: 'text',
      value: ''
    }
  ]
}

export default data
