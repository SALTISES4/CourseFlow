import { EditableDataType, EditableType } from '../../types'

const getPartData = (id: number): EditableDataType<EditableType.PART> => {
  return {
    title: 'Part name here',
    strategy: 3
  }
}

export default getPartData
