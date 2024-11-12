import { EditableDataType, EditableType } from '../../types'

const getOutcomeData = (id: number): EditableDataType<EditableType.OUTCOME> => {
  return {
    title: 'Outcome name here',
    description: 'Some outcome description',
    code: '123',
    objectSets: [1, 2]
  }
}

export default getOutcomeData
