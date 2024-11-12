import { EditableDataType, EditableType } from '../../types'

const getTermData = (id: number): EditableDataType<EditableType.TERM> => {
  return {
    title: 'Term name here'
  }
}

export default getTermData
