import { EditableDataType, EditableType } from '../../types'

const getOutcomeData = (id: number): EditableDataType<EditableType.NODE> => {
  return {
    title: 'Outcome name here',
    description: 'Some outcome description',
    contextType: 1,
    unitType: 2,
    taskType: 3,
    amount: 20,
    objectSets: [1, 2]
  }
}

export default getOutcomeData
